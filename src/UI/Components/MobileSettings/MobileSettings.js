/**
 * UI/Components/MobileSettings/MobileSettings.js
 *
 * Mobile settings panel — surfaces the RagnaTouch mobile/perf toggles in one
 * place: haptics, UI scale and left-handed layout.
 *
 * Each control writes its value to the runtime config (and refreshes the
 * relevant module), and the choices are persisted via Preferences. Stored
 * values are re-applied to the config when this module loads, so they take
 * effect on subsequent sessions without opening the panel.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

import Configs from 'Core/Configs.js';
import Preferences from 'Core/Preferences.js';
import UIScale from 'UI/UIScale.js';
import UIManager from 'UI/UIManager.js';
import GUIComponent from 'UI/GUIComponent.js';
import htmlText from './MobileSettings.html?raw';
import cssText from './MobileSettings.css?raw';

/**
 * Persisted panel state.
 */
const _preferences = Preferences.get(
	'MobileSettings',
	{
		show: false,
		x: 120,
		y: 120,
		haptics: false,
		uiScale: 'off',
		leftHanded: false
	},
	1.0
);

/**
 * Apply the stored settings to the runtime config. Safe to call at load:
 * UIScale.refresh() is a no-op visual when scale is 1, and Renderer.resize()
 * guards on an uninitialised context.
 */
function applyStored() {
	Configs.set('haptics', !!_preferences.haptics);
	Configs.set('uiScale', _preferences.uiScale);
	Configs.set('mobileLeftHanded', !!_preferences.leftHanded);
	UIScale.refresh();
}

const MobileSettings = new GUIComponent('MobileSettings', cssText);

MobileSettings.render = () => htmlText;

/**
 * Initialize UI: wire each control to apply + persist.
 */
MobileSettings.init = function init() {
	const root = this.getRoot();

	const closeBtn = root.querySelector('.close');
	if (closeBtn) {
		closeBtn.addEventListener('click', () => MobileSettings.toggle(false));
	}

	const haptics = root.querySelector('#ms-haptics');
	if (haptics) {
		haptics.addEventListener('change', function () {
			_preferences.haptics = this.checked;
			Configs.set('haptics', this.checked);
			_preferences.save();
		});
	}

	const uiScale = root.querySelector('#ms-uiscale');
	if (uiScale) {
		uiScale.addEventListener('change', function () {
			_preferences.uiScale = this.value;
			Configs.set('uiScale', this.value);
			UIScale.refresh();
			_preferences.save();
		});
	}

	const leftHanded = root.querySelector('#ms-lefthanded');
	if (leftHanded) {
		leftHanded.addEventListener('change', function () {
			_preferences.leftHanded = this.checked;
			Configs.set('mobileLeftHanded', this.checked);
			// Decoupled from MobileUI (avoids an import cycle): MobileUI listens.
			window.dispatchEvent(new Event('ragnatouch:mobilelayout'));
			_preferences.save();
		});
	}

	this.draggable('.titlebar');
};

/**
 * Reflect stored values on the controls every time the panel is shown.
 */
MobileSettings.onAppend = function onAppend() {
	const root = this.getRoot();

	this._host.style.top = _preferences.y + 'px';
	this._host.style.left = _preferences.x + 'px';

	const set = (sel, prop, value) => {
		const el = root.querySelector(sel);
		if (el) {
			el[prop] = value;
		}
	};
	set('#ms-haptics', 'checked', !!_preferences.haptics);
	set('#ms-uiscale', 'value', String(_preferences.uiScale));
	set('#ms-lefthanded', 'checked', !!_preferences.leftHanded);
};

/**
 * Persist position on remove.
 */
MobileSettings.onRemove = function onRemove() {
	_preferences.x = parseInt(this._host.style.left, 10) || _preferences.x;
	_preferences.y = parseInt(this._host.style.top, 10) || _preferences.y;
	_preferences.show = false;
	_preferences.save();
};

/**
 * Show / hide the panel.
 *
 * @param {boolean} [visible]
 */
MobileSettings.toggle = function toggle(visible) {
	const show = typeof visible === 'boolean' ? visible : !this.__active;
	if (show) {
		this.append();
		this._host.style.display = '';
		this.focus();
	} else {
		this.remove();
	}
	_preferences.show = show;
	_preferences.save();
};

// Re-apply stored settings to the runtime config when this module loads
// (i.e. when the mobile UI is active), so choices persist across sessions.
applyStored();

export default UIManager.addComponent(MobileSettings);
