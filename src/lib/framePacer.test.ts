import { describe, expect, it } from 'vitest';
import { FramePacer } from './framePacer.ts';

/**
 * Runs the pacer for ten seconds against a browser that fires the animation frame
 * callback at a fixed rate and paints every frame within one tick. `hiccupAt` delays
 * one callback, the way a garbage collection would. `jitterMs` shifts every
 * timestamp by a repeatable pseudo random amount inside that range.
 */
function paintedPerSecond(callbackMs: number, hiccupAt = -1, hiccupMs = 0, jitterMs = 0): number {
	const pacer = new FramePacer();
	const seconds = 10;
	let now = 0;
	let painted = 0;
	let ticks = 0;
	let random = 12345;
	while (now < seconds * 1000) {
		random = (random * 1103515245 + 12345) % 2147483648;
		const jitter = ((random / 2147483648) * 2 - 1) * jitterMs;
		if (pacer.tick(now + jitter)) painted++;
		ticks++;
		now += callbackMs + (ticks === hiccupAt ? hiccupMs : 0);
	}
	return painted / seconds;
}

describe('FramePacer', () => {
	it('paints 30 per second on a 60 Hz callback', () => {
		expect(paintedPerSecond(1000 / 60)).toBeGreaterThanOrEqual(29);
	});

	it('paints 30 per second on a 30 Hz callback, as Safari gives in Low Power Mode', () => {
		expect(paintedPerSecond(1000 / 30)).toBeGreaterThanOrEqual(29);
	});

	it('returns to 30 per second on a 30 Hz callback after one late callback', () => {
		expect(paintedPerSecond(1000 / 30, 40, 20)).toBeGreaterThanOrEqual(28);
	});

	it('returns to 30 per second on a 60 Hz callback after one late callback', () => {
		expect(paintedPerSecond(1000 / 60, 40, 40)).toBeGreaterThanOrEqual(28);
	});

	it('paints 30 per second on a 30 Hz callback with 1 ms of timestamp jitter', () => {
		// Callback timestamps are frame start times, so the real jitter is under that.
		expect(paintedPerSecond(1000 / 30, -1, 0, 1)).toBeGreaterThanOrEqual(29);
	});

	it('paints 30 per second on a 120 Hz callback', () => {
		expect(paintedPerSecond(1000 / 120)).toBeGreaterThanOrEqual(29);
		expect(paintedPerSecond(1000 / 120)).toBeLessThanOrEqual(31);
	});

	it('is back at 30 per second within a second of a two second pause', () => {
		const pacer = new FramePacer();
		const callbackMs = 1000 / 30;
		let now = 0;
		for (; now < 3000; now += callbackMs) pacer.tick(now);
		now += 2000;
		let painted = 0;
		const end = now + 1000;
		for (; now < end; now += callbackMs) if (pacer.tick(now)) painted++;
		expect(painted).toBeGreaterThanOrEqual(29);
	});

	it('backs off when every painted frame costs two callbacks', () => {
		// A device that needs 50 ms per painted frame on a 60 Hz display.
		const pacer = new FramePacer();
		let now = 0;
		let painted = 0;
		for (let tick = 0; tick < 600; tick++) {
			if (pacer.tick(now)) {
				painted++;
				now += 50;
			} else {
				now += 1000 / 60;
			}
		}
		expect(pacer.intervalMs).toBeGreaterThan(1000 / 30);
		expect(pacer.intervalMs).toBeLessThanOrEqual(1000 / 12);
	});
});
