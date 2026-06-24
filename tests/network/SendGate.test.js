import { describe, it, expect, vi } from 'vitest';
import { isSendAllowed } from 'Network/SendGate.js';
import SendGateDefault from 'Network/SendGate.js';

/**
 * Tier 2 send-side auth gate — regression + positive-control coverage.
 *
 * The gate is the defense-in-depth that keeps the PR #1 "connected-but-
 * unauthenticated zombie" unrepresentable: gameplay (zone) packets must never
 * reach the wire while the map session is not authenticated. The handshake
 * (map enter + keepalive) and all non-zone (login/char) packets must still flow.
 *
 * The disconnect-surfacing path itself lives in NetworkManager.onClose() (which
 * also flips authenticated -> false); these tests cover the pure send decision
 * that onClose's state change feeds into.
 */

// Representative packet constructors (stand-ins for the real PACKET.CZ.* structs).
function CZ_ENTER() {} // map-enter handshake
function CZ_REQUEST_TIME() {} // keepalive ping
function CZ_REQUEST_MOVE() {} // gameplay (walk)

const handshakePackets = new Set([CZ_ENTER, CZ_REQUEST_TIME]);

const opts = (over = {}) => ({
	enabled: true,
	isZone: true,
	authenticated: false,
	packetCtor: CZ_REQUEST_MOVE,
	handshakePackets,
	...over
});

describe('SendGate.isSendAllowed', () => {
	// --- Regression guard: the PR #1 "connected-but-unauthenticated zombie" ---
	it('refuses a gameplay (zone) packet while the map session is unauthenticated', () => {
		expect(isSendAllowed(opts({ packetCtor: CZ_REQUEST_MOVE }))).toBe(false);
	});

	it('allows the map-enter and keepalive handshake packets before authentication', () => {
		expect(isSendAllowed(opts({ packetCtor: CZ_ENTER }))).toBe(true);
		expect(isSendAllowed(opts({ packetCtor: CZ_REQUEST_TIME }))).toBe(true);
	});

	// --- Positive control: the gate must not pass by blocking everything ---
	it('allows the same gameplay packet once the map session is authenticated', () => {
		expect(isSendAllowed(opts({ authenticated: true }))).toBe(true);
	});

	// --- Inert when the feature flag is off (legacy behaviour unchanged) ---
	it('allows everything when the feature flag is off', () => {
		expect(isSendAllowed(opts({ enabled: false, authenticated: false }))).toBe(true);
	});

	// --- Login / char packets travel on a non-zone socket and always flow ---
	it('allows packets on a non-zone (login/char) socket regardless of auth', () => {
		expect(isSendAllowed(opts({ isZone: false }))).toBe(true);
	});

	// --- Defensive edges ---
	it('refuses when no handshake allowlist is registered (zone, unauthenticated)', () => {
		expect(isSendAllowed(opts({ handshakePackets: undefined }))).toBe(false);
		expect(isSendAllowed(opts({ handshakePackets: null }))).toBe(false);
	});

	it('refuses a null/undefined packet on an unauthenticated zone socket', () => {
		expect(isSendAllowed(opts({ packetCtor: null }))).toBe(false);
		expect(isSendAllowed(opts({ packetCtor: undefined }))).toBe(false);
	});

	it('exposes isSendAllowed on the default export', () => {
		expect(SendGateDefault.isSendAllowed).toBe(isSendAllowed);
	});
});

// Integration-style: model how NetworkManager.sendPacket() uses the gate, and spy
// on the send sink to prove blocked gameplay never reaches the wire while
// authenticated gameplay (and the handshake) does.
describe('SendGate as the send chokepoint (send-sink spy)', () => {
	// Minimal stand-in for sendPacket(): consult the gate, then "send".
	function makeSender({ isZone, authenticated }) {
		const wire = vi.fn();
		const send = packetCtor => {
			if (
				!isSendAllowed({
					enabled: true,
					isZone,
					authenticated,
					packetCtor,
					handshakePackets
				})
			) {
				return;
			}
			wire(packetCtor);
		};
		return { wire, send };
	}

	it('drops gameplay sends on an unauthenticated zone socket (zombie guard)', () => {
		const { wire, send } = makeSender({ isZone: true, authenticated: false });
		send(CZ_REQUEST_MOVE);
		expect(wire).not.toHaveBeenCalled();
	});

	it('lets the handshake through, then gameplay once authenticated', () => {
		// Handshake phase: enter + ping reach the wire, gameplay does not.
		const pre = makeSender({ isZone: true, authenticated: false });
		pre.send(CZ_ENTER);
		pre.send(CZ_REQUEST_TIME);
		pre.send(CZ_REQUEST_MOVE);
		expect(pre.wire).toHaveBeenCalledTimes(2);
		expect(pre.wire).not.toHaveBeenCalledWith(CZ_REQUEST_MOVE);

		// Authenticated: the same gameplay packet now reaches the wire.
		const post = makeSender({ isZone: true, authenticated: true });
		post.send(CZ_REQUEST_MOVE);
		expect(post.wire).toHaveBeenCalledWith(CZ_REQUEST_MOVE);
	});
});
