/**
 * UI/KeyboardInset.js
 *
 * Keep a focused input visible above the on-screen (virtual) keyboard on touch
 * devices. When an input is focused the visual viewport shrinks by the keyboard
 * height; we translate a target element up by that overlap and reset it on blur.
 *
 * No-op when there is no `visualViewport` or the session is not a touch session,
 * so desktop behaviour is unchanged. Uses `transform` only, so it never disturbs
 * the element's existing (draggable) top/left position.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

import Session from 'Engine/SessionStorage.js';

/**
 * Wire keyboard-aware repositioning for one input.
 *
 * @param {HTMLElement} input  - the focusable field (input / contenteditable)
 * @param {HTMLElement} target - element to translate up (e.g. the window host)
 */
export default function bindKeyboardInset(input, target) {
	if (!input || !target || typeof window === 'undefined' || !window.visualViewport) {
		return;
	}

	const vv = window.visualViewport;
	let active = false;

	const apply = () => {
		// Overlap = portion of the layout viewport hidden by the keyboard.
		const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
		target.style.transform = overlap > 0 ? 'translateY(' + -overlap + 'px)' : '';
	};

	const reset = () => {
		target.style.transform = '';
	};

	input.addEventListener('focus', () => {
		// Only assist real touch sessions; desktop keeps native behaviour.
		if (!Session.isTouchDevice) {
			return;
		}
		active = true;
		vv.addEventListener('resize', apply);
		vv.addEventListener('scroll', apply);
		// Defer once so the keyboard has begun to open before measuring.
		setTimeout(apply, 100);
	});

	input.addEventListener('blur', () => {
		if (!active) {
			return;
		}
		active = false;
		vv.removeEventListener('resize', apply);
		vv.removeEventListener('scroll', apply);
		reset();
	});
}
