/**
 * Core/AssetRetry.js
 *
 * Retry orchestration for transient asset-load failures.
 *
 * Pure: both the per-attempt loader and the timer are injected, so the retry
 * logic is fully unit-testable without a network. Reuses
 * Network/ReconnectPolicy for the backoff schedule.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

import ReconnectPolicy from 'Network/ReconnectPolicy.js';

/**
 * Decide whether an asset-load error is worth retrying.
 *
 * Definitive failures (4xx client errors, HTML "404 page" responses) fail
 * fast — the client legitimately requests many optional files that 404, and
 * retrying those would slow loading. Transient failures (5xx, offline blips,
 * DNS, dropped sockets) are retried.
 *
 * @param {?string} message
 * @return {boolean}
 */
export function isTransientError(message) {
	if (!message) {
		return false;
	}

	const m = String(message).toLowerCase();

	// HTML page returned in place of binary data == a 404/redirect page.
	if (m.indexOf('html instead of binary') !== -1) {
		return false;
	}

	const status = m.match(/http\s+(\d{3})/);
	if (status) {
		const code = parseInt(status[1], 10);
		// 4xx are definitive client errors; 5xx are server-side and retryable.
		return code >= 500;
	}

	// No HTTP status => network/transport error (offline, DNS) => retry.
	return true;
}

/**
 * Run a single-attempt loader, retrying transient failures with backoff.
 *
 * @param {function(function(*, ?string))} attempt - performs one load and
 *        calls back with (result, errorMessage); result != null means success.
 * @param {object} [options]
 * @param {number} [options.maxRetries=2] - retries allowed after the first try
 * @param {function(function, number)} [options.schedule] - timer (injectable)
 * @param {ReconnectPolicy} [options.policy] - backoff source (injectable)
 * @param {function(*, ?string)} done - final callback (same shape as attempt)
 */
export function withRetry(attempt, options, done) {
	const opts = options || {};
	const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : 2;
	const schedule = opts.schedule || ((fn, delay) => setTimeout(fn, delay));
	const policy =
		opts.policy ||
		new ReconnectPolicy({ baseDelay: 200, factor: 2, maxDelay: 2000, jitter: 0.25, maxAttempts: maxRetries });

	let retries = 0;

	const run = () => {
		attempt((result, errorMessage) => {
			if (result != null) {
				done(result);
				return;
			}

			if (retries < maxRetries && isTransientError(errorMessage) && policy.canRetry()) {
				retries += 1;
				schedule(run, policy.nextDelay());
				return;
			}

			done(null, errorMessage);
		});
	};

	run();
}
