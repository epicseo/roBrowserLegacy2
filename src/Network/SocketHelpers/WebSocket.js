/**
 * Network/SocketHelpers/WebSocket.js
 *
 * HTML5 WebSocket if the server support the protocole
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault
 */

import Configs from 'Core/Configs.js';
import ReconnectPolicy from 'Network/ReconnectPolicy.js';

/**
 * HTML5 WebSocket System
 *
 * @param {string} host
 * @param {number} port
 * @param {string} proxy
 */
function Socket(host, port, proxy) {
	this.connected = false;

	// Build the connection URL (optionally through a wsProxy)
	let url = 'ws://' + host + ':' + port + '/';
	if (proxy) {
		url = proxy;

		if (!url.match(/\/$/)) {
			url += '/';
		}

		url += host + ':' + port;
	}
	this._url = url;

	// Reconnection state. Auto-reconnect is opt-in via config and OFF by
	// default, so the default behaviour is identical to the legacy socket:
	// an unexpected close simply notifies onClose().
	this._userClosed = false; // close() was called by us
	this._everConnected = false; // a connection succeeded at least once
	this._reconnectTimer = null;
	this._autoReconnect = !!Configs.get('autoReconnect', false);
	this._policy = new ReconnectPolicy(Configs.get('autoReconnectOptions', {}));

	this._open();
}

/**
 * Open (or re-open) the underlying WebSocket and (re)bind its handlers.
 */
Socket.prototype._open = function Open() {
	const self = this;
	const ws = new WebSocket(this._url);
	ws.binaryType = 'arraybuffer';
	this.ws = ws;

	ws.onopen = function OnOpen() {
		const isReconnect = self._everConnected;
		self.connected = true;
		self._everConnected = true;
		self._policy.reset();

		if (isReconnect) {
			// A dropped connection was recovered. Surface it through a
			// dedicated hook so callers can re-authenticate / restore state.
			// The transport alone cannot restore RO game session state.
			if (self.onReconnect) {
				self.onReconnect();
			}
		} else if (self.onComplete) {
			// Result of the initial connection attempt.
			self.onComplete(true);
		}
	};

	ws.onerror = function OnError() {
		// Only the initial connection reports failure here. Failures that
		// happen while reconnecting are handled by onclose (retry / give up).
		if (!self.connected && !self._everConnected && self.onComplete) {
			self.onComplete(false);
		}
	};

	ws.onmessage = function OnMessage(event) {
		if (self.onMessage) {
			self.onMessage(event.data);
		}
	};

	ws.onclose = function OnClose() {
		self.connected = false;

		// Notify-and-stop (legacy behaviour) when: we closed on purpose,
		// auto-reconnect is disabled, we never connected, or attempts are
		// exhausted.
		if (self._userClosed || !self._autoReconnect || !self._everConnected || !self._policy.canRetry()) {
			if (self.onClose) {
				self.onClose();
			}
			return;
		}

		// Otherwise schedule a reconnect with exponential backoff.
		const delay = self._policy.nextDelay();
		self._reconnectTimer = setTimeout(function reopen() {
			self._reconnectTimer = null;
			if (!self._userClosed) {
				self._open();
			}
		}, delay);
	};
};

/**
 * Sending packet to applet
 *
 * @param {ArrayBuffer} buffer
 */
Socket.prototype.send = function Send(buffer) {
	if (this.connected) {
		this.ws.send(buffer);
	}
};

/**
 * Closing connection to server.
 * User-initiated: cancels any pending reconnect and disables further retries.
 */
Socket.prototype.close = function Close() {
	this._userClosed = true;

	if (this._reconnectTimer) {
		clearTimeout(this._reconnectTimer);
		this._reconnectTimer = null;
	}

	if (this.connected) {
		this.ws.close();
		this.connected = false;
	}
};

/**
 * Export
 */
export default Socket;
