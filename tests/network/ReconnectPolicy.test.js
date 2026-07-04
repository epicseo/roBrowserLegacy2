import { describe, it, expect } from 'vitest';
import ReconnectPolicy from 'Network/ReconnectPolicy.js';

describe('ReconnectPolicy', () => {
	it('produces exponential base delays with defaults (1s base, x2, 30s cap)', () => {
		const p = new ReconnectPolicy();
		expect(p.baseDelayFor(0)).toBe(1000);
		expect(p.baseDelayFor(1)).toBe(2000);
		expect(p.baseDelayFor(2)).toBe(4000);
		expect(p.baseDelayFor(3)).toBe(8000);
		expect(p.baseDelayFor(4)).toBe(16000);
		// 32000 would exceed the 30000 cap
		expect(p.baseDelayFor(5)).toBe(30000);
		expect(p.baseDelayFor(10)).toBe(30000);
	});

	it('nextDelay() with jitter disabled returns the exact sequence and advances attempts', () => {
		const p = new ReconnectPolicy({ jitter: 0 });
		expect(p.attempts).toBe(0);
		expect(p.nextDelay()).toBe(1000);
		expect(p.attempts).toBe(1);
		expect(p.nextDelay()).toBe(2000);
		expect(p.nextDelay()).toBe(4000);
		expect(p.attempts).toBe(3);
	});

	it('jitter centres on the base delay when rng() === 0.5', () => {
		const p = new ReconnectPolicy({ jitter: 0.25 }, () => 0.5);
		expect(p.nextDelay()).toBe(1000);
		expect(p.nextDelay()).toBe(2000);
	});

	it('jitter spans [base*(1-j), base*(1+j)] at the rng extremes', () => {
		const low = new ReconnectPolicy({ jitter: 0.25 }, () => 0);
		expect(low.nextDelay()).toBe(750); // 1000 * (1 - 0.25)

		const high = new ReconnectPolicy({ jitter: 0.25 }, () => 1);
		expect(high.nextDelay()).toBe(1250); // 1000 * (1 + 0.25)
	});

	it('honours maxAttempts via canRetry()', () => {
		const p = new ReconnectPolicy({ maxAttempts: 3, jitter: 0 });
		expect(p.canRetry()).toBe(true);
		p.nextDelay();
		p.nextDelay();
		expect(p.canRetry()).toBe(true);
		p.nextDelay();
		expect(p.attempts).toBe(3);
		expect(p.canRetry()).toBe(false);
	});

	it('reset() returns the attempt counter to zero (delays restart)', () => {
		const p = new ReconnectPolicy({ jitter: 0 });
		p.nextDelay();
		p.nextDelay();
		expect(p.attempts).toBe(2);
		p.reset();
		expect(p.attempts).toBe(0);
		expect(p.nextDelay()).toBe(1000);
	});

	it('respects a custom base, factor and cap', () => {
		const p = new ReconnectPolicy({ baseDelay: 500, factor: 3, maxDelay: 5000, jitter: 0 });
		expect(p.baseDelayFor(0)).toBe(500);
		expect(p.baseDelayFor(1)).toBe(1500);
		expect(p.baseDelayFor(2)).toBe(4500);
		expect(p.baseDelayFor(3)).toBe(5000); // 13500 capped to 5000
	});

	it('sanitises invalid options', () => {
		// factor <= 0 falls back to 1 (no growth, never below base)
		const flat = new ReconnectPolicy({ factor: 0, jitter: 0 });
		expect(flat.baseDelayFor(0)).toBe(1000);
		expect(flat.baseDelayFor(5)).toBe(1000);

		// jitter is clamped into [0, 1]
		const clamped = new ReconnectPolicy({ jitter: 5 });
		expect(clamped.jitter).toBe(1);

		// maxDelay can never be below baseDelay
		const cap = new ReconnectPolicy({ baseDelay: 2000, maxDelay: 100, jitter: 0 });
		expect(cap.maxDelay).toBe(2000);
		expect(cap.baseDelayFor(0)).toBe(2000);
	});
});
