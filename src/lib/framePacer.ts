/**
 * Paces the animation loop to what the device can paint. The loop asks for every
 * animation frame and paints only when the pacer says so.
 *
 * Thirty per second while the device keeps up, which is already lower than the
 * display rate because the globe is coarse. A device that cannot paint that fast is
 * paced down to its own speed instead of queueing frames it will never show.
 */
export const FAST_FRAME_MS = 1000 / 30;
export const SLOW_FRAME_MS = 1000 / 12;

/**
 * The slack matters: two ticks of a 60Hz display are 33.32 ms, a hair under a 30 per
 * second target, so an exact test skips every other pair and the globe runs at 20 per
 * second instead of 30. Four milliseconds also covers the timestamp jitter of a 30 Hz
 * callback, and still keeps one 60 Hz tick (16.7 ms) well short of the gate.
 */
const SLACK_MS = 4;

/**
 * A gap this long is a pause, not a slow frame: a background tab, a sleeping laptop,
 * a lid closed. It says nothing about frame cost and is not measured.
 */
const PAUSE_MS = 250;

export class FramePacer {
	private frameMs = FAST_FRAME_MS;
	private frameCost = FAST_FRAME_MS;
	private paintedAt = 0;
	private lastCallback = 0;
	private measuring = false;

	/** Current target interval between painted frames, in milliseconds. */
	get intervalMs(): number {
		return this.frameMs;
	}

	/**
	 * Called on every animation frame callback. Returns true when this frame should
	 * be painted.
	 */
	tick(now: number): boolean {
		if (this.lastCallback === 0) this.lastCallback = now;
		const sinceCallback = now - this.lastCallback;
		this.lastCallback = now;

		// The callback after a painted frame arrives once that frame is on screen, so
		// the gap is what one frame really costs: our work plus layout and paint. Pace
		// the next frame to that cost, between 30 and 12 per second.
		//
		// Both tests keep the slack. A browser that fires the callback 30 times a
		// second, as Safari does in Low Power Mode, reports a gap equal to the 30 per
		// second target on every cheap frame. An exact test read that as an overrun,
		// backed off to one paint per two callbacks, and then never sped up again,
		// because the gap it saw was still not under half of the slower target.
		if (this.measuring) {
			this.measuring = false;
			if (sinceCallback < PAUSE_MS) this.frameCost += (sinceCallback - this.frameCost) * 0.2;
			if (this.frameCost > this.frameMs + SLACK_MS) {
				this.frameMs = Math.min(SLOW_FRAME_MS, this.frameMs * 1.2);
			} else if (this.frameCost < this.frameMs - SLACK_MS) {
				this.frameMs = Math.max(FAST_FRAME_MS, this.frameMs / 1.2);
			}
		}

		if (now - this.paintedAt < this.frameMs - SLACK_MS) return false;
		this.paintedAt = now;
		this.measuring = true;
		return true;
	}
}
