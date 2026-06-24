/**
 * Core/Haptics.js
 *
 * Thin wrapper around the Vibration API for tactile feedback on touch devices.
 *
 * Gated three ways: the device must support `navigator.vibrate`, the session
 * must be a touch session, and the `haptics` config must be enabled. It is OFF
 * by default (opt-in via config / the mobile settings panel) so it never
 * surprises desktop users or drains battery unasked.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

import Configs from 'Core/Configs.js';
import Session from 'Engine/SessionStorage.js';

/**
 * @const named vibration patterns (ms, or on/off arrays)
 */
const PATTERNS = {
	tap: 8, // light button press
	skill: 18, // skill / action
	hit: [0, 12, 30, 12] // landed attack
};

class Haptics {
	/**
	 * @return {boolean} whether haptics may fire right now
	 */
	static enabled() {
		return !!(
			Session.isTouchDevice &&
			Configs.get('haptics', false) &&
			typeof navigator !== 'undefined' &&
			typeof navigator.vibrate === 'function'
		);
	}

	/**
	 * Fire a raw vibration pattern (number ms or array). Safe no-op when disabled.
	 *
	 * @param {number|number[]} pattern
	 */
	static vibrate(pattern) {
		if (!Haptics.enabled()) {
			return;
		}
		try {
			navigator.vibrate(pattern);
		} catch (_e) {
			// Some browsers throw if called outside a user gesture — ignore.
		}
	}

	/**
	 * Fire a named pattern.
	 *
	 * @param {string} name - one of PATTERNS
	 */
	static play(name) {
		if (Object.prototype.hasOwnProperty.call(PATTERNS, name)) {
			Haptics.vibrate(PATTERNS[name]);
		}
	}
}

export default Haptics;
