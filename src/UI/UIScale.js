/**
 * UI/UIScale.js
 *
 * Optional global UI scaling for small screens.
 *
 * RO windows are fixed-size (pixels from BMP assets) and overflow phone
 * screens. This applies a uniform CSS `zoom` to each registered component host
 * so windows shrink to fit. `zoom` (not `transform: scale`) is used on purpose:
 * it scales the layout box and the browser maps pointer events through it, so
 * dragging and hit-testing keep working.
 *
 * Opt-in and OFF by default: with no `uiScale` config the factor is 1 and hosts
 * are untouched, so existing behaviour is unchanged. Set `uiScale` to a number
 * (fixed factor) or `'auto'` (derive from the viewport). On-device validation is
 * required before relying on it — see CHANGES.md.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

import Configs from 'Core/Configs.js';

/**
 * @const baseline the fixed UI is designed around, and the smallest factor.
 */
const DESIGN_W = 800;
const DESIGN_H = 600;
const MIN_SCALE = 0.5;

/**
 * @var {Set<HTMLElement>} live component hosts to keep in sync on resize
 */
const _hosts = new Set();

/**
 * @var {number} current effective scale
 */
let _scale = 1;

/**
 * Derive an auto scale from the viewport: shrink (never enlarge) to fit.
 *
 * @return {number}
 */
function computeAuto() {
	const w = window.innerWidth || DESIGN_W;
	const h = window.innerHeight || DESIGN_H;
	const fit = Math.min(w / DESIGN_W, h / DESIGN_H, 1);
	return Math.max(MIN_SCALE, fit);
}

/**
 * Resolve the configured scale to a positive number.
 *
 * @return {number}
 */
function resolve() {
	const cfg = Configs.get('uiScale', 'off');
	if (cfg === 'auto') {
		return computeAuto();
	}
	const n = parseFloat(cfg);
	return Number.isFinite(n) && n > 0 ? n : 1;
}

class UIScale {
	/**
	 * @return {number} current effective scale
	 */
	static get() {
		return _scale;
	}

	/**
	 * Apply the current scale to one host (no-op visual when scale === 1).
	 *
	 * @param {HTMLElement} host
	 */
	static applyTo(host) {
		if (!host || !host.style) {
			return;
		}
		host.style.zoom = _scale === 1 ? '' : String(_scale);
	}

	/**
	 * Track a host and apply the current scale to it.
	 *
	 * @param {HTMLElement} host
	 */
	static register(host) {
		if (!host) {
			return;
		}
		_hosts.add(host);
		// Re-resolve in case the config became available after module load.
		UIScale.refresh();
	}

	/**
	 * Stop tracking a host.
	 *
	 * @param {HTMLElement} host
	 */
	static unregister(host) {
		_hosts.delete(host);
	}

	/**
	 * Recompute the scale from config/viewport and re-apply to all hosts.
	 *
	 * @return {number} the new scale
	 */
	static refresh() {
		_scale = resolve();
		_hosts.forEach(UIScale.applyTo);
		return _scale;
	}
}

// Resolve once now (defaults to 1 = no change if config not ready / unset) and
// keep in sync with viewport changes when in 'auto' mode.
_scale = resolve();

if (typeof window !== 'undefined') {
	window.addEventListener('resize', () => UIScale.refresh());
	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', () => UIScale.refresh());
	}
}

export default UIScale;
