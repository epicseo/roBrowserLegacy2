/**
 * Network/SendGate.js
 *
 * Send-side authentication gate for the map (zone) session.
 *
 * Tier 2 reconnect safety: "transport-connected" and "session-authenticated" are
 * distinct states. A reconnected (or not-yet-admitted) zone socket is connected
 * but NOT authenticated until the map server processes the map-enter handshake
 * and replies with ACCEPT_ENTER. This pure predicate is the single decision used
 * by NetworkManager.sendPacket() to refuse GAMEPLAY (zone) packets while the map
 * session is unauthenticated, so gameplay traffic can never be sent into a dead
 * or unauthenticated session (the "connected-but-unauthenticated zombie" that
 * caused live auto-reconnect to be reverted in the previous PR).
 *
 * Always allowed: every packet on a non-zone socket (the login / char handshake),
 * and — on the zone socket before authentication — only the registered handshake
 * packets (the map-enter packet and the keepalive ping). Everything else is
 * refused until ACCEPT_ENTER flips the session to authenticated.
 *
 * Pure and dependency-free, so it is fully unit-testable in isolation.
 *
 * This file is part of ROBrowser, (http://www.robrowser.com/).
 *
 * @author Vincent Thibault and the community
 */

/**
 * Decide whether an outbound packet may be sent.
 *
 * @param {object} options
 * @param {boolean} options.enabled - feature flag (experimentalReconnect). When
 *        false the gate is inert and every packet is allowed (legacy behaviour).
 * @param {boolean} options.isZone - is the current socket the zone (map) server?
 * @param {boolean} options.authenticated - has the map session been authenticated
 *        (ACCEPT_ENTER processed)?
 * @param {Function} [options.packetCtor] - the outbound packet's constructor.
 * @param {Set<Function>} [options.handshakePackets] - allowlist of packet
 *        constructors permitted on the zone socket before authentication
 *        (the map-enter packet + the keepalive ping).
 * @return {boolean} true if the send is allowed, false if it must be refused.
 */
function isSendAllowed(options) {
	const opts = options || {};

	// Gate disabled, not on the zone socket, or already authenticated: allow.
	// Login / char packets travel on a non-zone socket and so always pass.
	if (!opts.enabled || !opts.isZone || opts.authenticated) {
		return true;
	}

	// Unauthenticated zone socket: allow ONLY the registered handshake packets
	// (map enter + keepalive); refuse everything else (gameplay).
	return !!opts.packetCtor && opts.handshakePackets instanceof Set && opts.handshakePackets.has(opts.packetCtor);
}

export { isSendAllowed };

export default {
	isSendAllowed: isSendAllowed
};
