import { describe, it, expect } from 'vitest';
import { isTransientError, withRetry } from 'Core/AssetRetry.js';
import ReconnectPolicy from 'Network/ReconnectPolicy.js';

describe('isTransientError', () => {
	it('treats 4xx and HTML-404 pages as definitive (no retry)', () => {
		expect(isTransientError('HTTP 404')).toBe(false);
		expect(isTransientError('HTTP 400')).toBe(false);
		expect(isTransientError('HTTP 403')).toBe(false);
		expect(isTransientError('Received HTML instead of binary data (likely 404 page)')).toBe(false);
		expect(isTransientError(null)).toBe(false);
		expect(isTransientError('')).toBe(false);
	});

	it('treats 5xx and network errors as transient (retry)', () => {
		expect(isTransientError('HTTP 500')).toBe(true);
		expect(isTransientError('HTTP 503')).toBe(true);
		expect(isTransientError('Failed to fetch')).toBe(true);
		expect(isTransientError('network error')).toBe(true);
		expect(isTransientError("Can't get file")).toBe(true);
	});
});

describe('withRetry', () => {
	const syncSchedule = fn => fn(); // run immediately, ignore the delay
	const freshPolicy = () => new ReconnectPolicy({ baseDelay: 1, factor: 2, jitter: 0, maxAttempts: 100 });

	it('passes through a first-attempt success without scheduling', () => {
		let scheduled = 0;
		let result = 'unset';
		withRetry(
			cb => cb('BUFFER'),
			{ maxRetries: 2, schedule: () => scheduled++, policy: freshPolicy() },
			r => {
				result = r;
			}
		);
		expect(result).toBe('BUFFER');
		expect(scheduled).toBe(0);
	});

	it('retries a transient failure and then succeeds', () => {
		let attempts = 0;
		const attempt = cb => {
			attempts++;
			attempts < 3 ? cb(null, 'network error') : cb('OK');
		};
		let result, err;
		withRetry(attempt, { maxRetries: 5, schedule: syncSchedule, policy: freshPolicy() }, (r, e) => {
			result = r;
			err = e;
		});
		expect(attempts).toBe(3);
		expect(result).toBe('OK');
		expect(err).toBeUndefined();
	});

	it('does not retry a definitive (404) failure', () => {
		let attempts = 0;
		let result = 'unset';
		let err;
		withRetry(
			cb => {
				attempts++;
				cb(null, 'HTTP 404');
			},
			{ maxRetries: 5, schedule: syncSchedule, policy: freshPolicy() },
			(r, e) => {
				result = r;
				err = e;
			}
		);
		expect(attempts).toBe(1);
		expect(result).toBe(null);
		expect(err).toBe('HTTP 404');
	});

	it('gives up after maxRetries on a persistent transient failure', () => {
		let attempts = 0;
		let result = 'unset';
		withRetry(
			cb => {
				attempts++;
				cb(null, 'network error');
			},
			{ maxRetries: 2, schedule: syncSchedule, policy: freshPolicy() },
			r => {
				result = r;
			}
		);
		expect(attempts).toBe(3); // 1 initial + 2 retries
		expect(result).toBe(null);
	});

	it('drives delays from the backoff policy', () => {
		const delays = [];
		const schedule = (fn, d) => {
			delays.push(d);
			fn();
		};
		withRetry(
			cb => cb(null, 'HTTP 500'),
			{
				maxRetries: 3,
				schedule,
				policy: new ReconnectPolicy({ baseDelay: 100, factor: 2, jitter: 0, maxAttempts: 100 })
			},
			() => {}
		);
		expect(delays).toEqual([100, 200, 400]);
	});
});
