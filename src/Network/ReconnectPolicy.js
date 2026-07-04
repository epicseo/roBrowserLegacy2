/**
 * Network/ReconnectPolicy.js
 *
 * Exponential-backoff policy for transport reconnection.
 *
 * Pure (no I/O, no globals, no timers) so it is fully unit-testable. The
 * WebSocket SocketHelper consumes it to schedule reconnect attempts after an
 * unexpected disconnect. Keeping the math here — separate from the socket —
 * means the backoff behaviour can be verified without a live server.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

/**
 * @type {object} default backoff parameters
 */
const DEFAULTS = {
	baseDelay: 1000, // ms, delay before the first retry
	factor: 2, // exponential growth factor between attempts
	maxDelay: 30000, // ms, cap applied to a single delay
	maxAttempts: Infinity, // give up after this many attempts
	jitter: 0.25 // +/- fraction of randomised jitter (0 disables jitter)
};

/**
 * Exponential backoff with optional jitter and a maximum attempt count.
 */
class ReconnectPolicy {
	/**
	 * @param {object} [options] - overrides for DEFAULTS
	 * @param {function} [rng] - random source returning [0,1) (injectable for tests)
	 */
	constructor(options = {}, rng = Math.random) {
		const opts = Object.assign({}, DEFAULTS, options || {});

		this.baseDelay = Math.max(0, opts.baseDelay);
		this.factor = opts.factor > 0 ? opts.factor : 1;
		this.maxDelay = Math.max(this.baseDelay, opts.maxDelay);
		this.maxAttempts = opts.maxAttempts;
		this.jitter = Math.min(1, Math.max(0, opts.jitter));
		this._rng = typeof rng === 'function' ? rng : Math.random;
		this._attempts = 0;
	}

	/**
	 * @return {number} number of attempts consumed so far
	 */
	get attempts() {
		return this._attempts;
	}

	/**
	 * @return {boolean} whether another attempt is allowed
	 */
	canRetry() {
		return this._attempts < this.maxAttempts;
	}

	/**
	 * Deterministic base delay (no jitter) for a 0-based attempt index.
	 *
	 * @param {number} attempt
	 * @return {number} delay in ms, capped at maxDelay
	 */
	baseDelayFor(attempt) {
		const raw = this.baseDelay * Math.pow(this.factor, attempt);
		return Math.min(this.maxDelay, raw);
	}

	/**
	 * Delay (ms) to wait before the next attempt, applying jitter, then
	 * advance the internal attempt counter.
	 *
	 * @return {number}
	 */
	nextDelay() {
		const base = this.baseDelayFor(this._attempts);
		this._attempts += 1;

		if (this.jitter === 0) {
			return base;
		}

		// multiplier in [1 - jitter, 1 + jitter]; rng() === 0.5 => exactly base
		const multiplier = 1 + this.jitter * (2 * this._rng() - 1);
		return Math.max(0, Math.round(base * multiplier));
	}

	/**
	 * Reset the attempt counter. Call after a successful (re)connect.
	 */
	reset() {
		this._attempts = 0;
	}
}

export default ReconnectPolicy;
