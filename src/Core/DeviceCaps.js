/**
 * Core/DeviceCaps.js
 *
 * Device-capability detection and adaptive graphics defaults.
 *
 * The decision logic (recommendQuality) is pure and unit-tested; detect() just
 * feeds it the live environment (pointer type, CPU cores, memory, DPR). These
 * values are only used as DEFAULTS for graphics preferences, so a saved user
 * preference or an explicit `quality` config always wins.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

/**
 * Recommend a render-scale percentage and FPS cap for the given capabilities.
 * Pure: same input always yields the same output.
 *
 * @param {object} [caps]
 * @param {boolean} [caps.mobile] - primarily-touch device
 * @param {number} [caps.cores]   - navigator.hardwareConcurrency
 * @param {number} [caps.memory]  - navigator.deviceMemory (GiB)
 * @param {number} [caps.dpr]     - window.devicePixelRatio
 * @return {{quality:number, fpslimit:number}}
 */
export function recommendQuality(caps) {
	const { mobile = false, cores = 8, memory = 8, dpr = 1 } = caps || {};

	let quality = 100;
	let fpslimit = 60;

	if (mobile) {
		// High-DPR phone screens are fill-rate bound; render below native res.
		quality = dpr >= 3 ? 60 : dpr >= 2 ? 75 : 90;
	}

	// Few cores / little memory: reduce further.
	if (cores <= 4 || memory <= 4) {
		quality = Math.min(quality, mobile ? 60 : 80);
	}

	// Very low-end: cap resolution and frame rate to stay responsive.
	if (cores <= 2 || memory <= 2) {
		quality = Math.min(quality, 50);
		fpslimit = 30;
	}

	return { quality, fpslimit };
}

/**
 * Detect the current environment and return adaptive defaults. Falls back to
 * full quality when an API is unavailable (e.g. desktop, or jsdom in tests).
 *
 * @return {{quality:number, fpslimit:number}}
 */
export function detect() {
	const nav = typeof navigator !== 'undefined' ? navigator : {};
	const win = typeof window !== 'undefined' ? window : {};

	let mobile = false;
	try {
		mobile = !!(win.matchMedia && win.matchMedia('(pointer: coarse)').matches);
	} catch (_e) {
		mobile = false;
	}

	return recommendQuality({
		mobile,
		cores: nav.hardwareConcurrency || 8,
		memory: nav.deviceMemory || 8,
		dpr: win.devicePixelRatio || 1
	});
}

export default { recommendQuality, detect };
