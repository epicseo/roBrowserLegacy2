import { describe, it, expect } from 'vitest';
import { recommendQuality } from 'Core/DeviceCaps.js';

describe('recommendQuality', () => {
	it('keeps full quality on a capable desktop', () => {
		expect(recommendQuality({ mobile: false, cores: 8, memory: 8, dpr: 1 })).toEqual({
			quality: 100,
			fpslimit: 60
		});
	});

	it('defaults to full quality with no input', () => {
		expect(recommendQuality()).toEqual({ quality: 100, fpslimit: 60 });
	});

	it('lowers render scale on high-DPR phones', () => {
		expect(recommendQuality({ mobile: true, cores: 8, memory: 8, dpr: 3 }).quality).toBe(60);
		expect(recommendQuality({ mobile: true, cores: 8, memory: 8, dpr: 2 }).quality).toBe(75);
		expect(recommendQuality({ mobile: true, cores: 8, memory: 8, dpr: 1 }).quality).toBe(90);
	});

	it('reduces quality on low core/memory machines', () => {
		// desktop, 4 cores -> capped at 80
		expect(recommendQuality({ mobile: false, cores: 4, memory: 8, dpr: 1 }).quality).toBe(80);
		// mobile, 4 cores -> capped at 60
		expect(recommendQuality({ mobile: true, cores: 4, memory: 8, dpr: 1 }).quality).toBe(60);
	});

	it('caps resolution and FPS on very low-end devices', () => {
		const r = recommendQuality({ mobile: true, cores: 2, memory: 2, dpr: 2 });
		expect(r.quality).toBe(50);
		expect(r.fpslimit).toBe(30);
	});

	it('never raises quality above 100 or below 50', () => {
		const r = recommendQuality({ mobile: true, cores: 1, memory: 1, dpr: 4 });
		expect(r.quality).toBeGreaterThanOrEqual(50);
		expect(r.quality).toBeLessThanOrEqual(100);
	});
});
