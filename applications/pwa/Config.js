/**
 * ROBrowser Configuration - Default Settings
 *
 * This file contains default configuration values.
 * To override settings without modifying this file, create Config.local.js
 * with your custom values in window.ROConfigLocal.
 *
 * Example Config.local.js:
 *   window.ROConfigLocal = {
 *       servers: [{ display: 'My Server', address: '192.168.1.1', ... }],
 *       skipIntro: true
 *   };
 */
window.ROConfigBase = {
	type: 'FRAME',
	application: 'ONLINE',
	development: true,
	remoteClient: 'https://grf.robrowser.com/',
	servers: [
		{
			display: 'roBrowser Demo Server',
			desc: 'demo server',
			address: '127.0.0.1',
			port: 6900,
			version: 25,
			langtype: 12,
			packetver: 20130618,
			renewal: false,
			worldMapSettings: { episode: 12 },
			packetKeys: false,
			socketProxy: 'wss://connect.robrowser.com',
			adminList: [2000000]
		}
		// ADD PUBLIC TEST SERVERS HERE WITH _M _F REGISTRATION
	],
	packetDump: false,
	// Auto-reconnect the WebSocket transport with exponential backoff after an
	// unexpected disconnect (mobile networks drop often). Opt-in; default off.
	// The transport reconnects, but restoring an in-game RO session also needs
	// re-authentication — validate against your server before relying on it.
	autoReconnect: false,
	// autoReconnectOptions: { baseDelay: 1000, factor: 2, maxDelay: 30000, maxAttempts: Infinity, jitter: 0.25 },
	// Retries for transient asset-load failures (5xx / offline blips). 4xx and
	// missing files fail fast and are not retried. Set 0 to disable.
	assetMaxRetries: 2,
	skipServerList: true,
	skipIntro: false,
	aura: {},
	autoLogin: [],
	BGMFileExtension: ['mp3'],
	calculateHash: false,
	CameraMaxZoomOut: 5,
	charBlockSize: 0,
	clientHash: null,
	clientVersionMode: 'PacketVer',
	disableConsole: false,
	enableAchievements: false,
	enableBank: false,
	enableCashShop: false,
	enableCheckAttendance: false,
	enableDmgSuffix: false,
	enableHomunAutoFeed: false,
	enableMapName: false,
	FirstPersonCamera: false,
	grfList: null,
	hashFiles: [],
	loadLua: false,
	onReady: null,
	plugins: {},
	registrationweb: '',
	saveFiles: true,
	ThirdPersonCamera: false,
	transitionDuration: 500,
	useSystemFolderFont: false
};
