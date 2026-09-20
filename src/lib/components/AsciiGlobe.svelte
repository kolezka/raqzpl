<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AXIAL_TILT,
		DEFAULT_COLS,
		DEFAULT_ROWS,
		fitGrid,
		LABEL_SCALE,
		renderBackdrop,
		renderGlobe
	} from '$lib/globe';

	interface Props {
		/** Titles shown in the middle of the globe, one after the other. */
		titles?: string[];
		/** Line below the title. */
		subtitle?: string;
		/** Time for one full turn, in milliseconds. */
		turnMs?: number;
		/** Time each title stays on screen, in milliseconds. */
		swapMs?: number;
		/** Time the title needs to settle out of the scrambled characters. */
		morphMs?: number;
	}

	let {
		titles = ['raqz.pl', 'raqz.dev', 'raqz.link', 'raqz.app', 'raqz.contact'],
		subtitle = 'Mariusz Rakus',
		turnMs = 28000,
		swapMs = 3600,
		morphMs = 900
	}: Props = $props();

	/**
	 * Frame pacing. Thirty per second while the device keeps up, which is already
	 * lower than the display rate because the globe is coarse. A device that cannot
	 * paint that fast is paced down to its own speed instead of queueing frames it
	 * will never show, which is what made a laptop in low power mode stutter.
	 */
	const FAST_FRAME_MS = 1000 / 30;
	const SLOW_FRAME_MS = 1000 / 12;

	/** How far the pointer tips the globe, in radians. */
	const MAX_PITCH = 0.3;
	const MAX_YAW = 0.32;

	/**
	 * The tilt is rounded to this step. The renderer caches everything that depends on
	 * the tilt, so a value that settles on an exact step keeps the cache alive once the
	 * pointer stops. The step is about a tenth of a cell on the disc, so it does not show.
	 */
	const PITCH_STEP = 1 / 512;

	/** Characters in the probe line. Only used to measure one character cell. */
	const PROBE_LENGTH = 20;

	/** Grid size. The server uses the default, the browser fits it to the window. */
	let cols = $state(DEFAULT_COLS);
	let rows = $state(DEFAULT_ROWS);
	let probe: HTMLPreElement | undefined = $state();

	/** Stars and the glow round the disc only change when the grid does. */
	const backdrop = $derived(renderBackdrop(cols, rows));

	let angle = $state(0);
	let pitch = $state(0);
	let titleIndex = $state(0);
	let titleProgress = $state(1);
	let seed = $state(0);
	/** Milliseconds since the first frame. Drives the satellites. */
	let clock = $state(0);

	const frame = $derived(
		renderGlobe({
			angle,
			pitch,
			roll: AXIAL_TILT,
			title: titles[titleIndex],
			subtitle,
			titleProgress,
			seed,
			time: clock,
			cols,
			rows
		})
	);

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let request = 0;
		let titleTimer = 0;
		let fitRequest = 0;
		let startedAt = 0;
		let paintedAt = 0;
		let targetPitch = 0;
		let targetYaw = 0;
		let easedPitch = 0;
		let easedYaw = 0;
		let frameMs = FAST_FRAME_MS;
		let lastCallback = 0;
		let frameCost = FAST_FRAME_MS;
		let measuring = false;

		// The grid covers the whole window: stars reach both edges on a wide screen, and
		// the globe, which keeps nine tenths of the grid height, fills a tall phone.
		// Rounded up to whole label cells, so the label grid is exactly as large.
		const fit = () => {
			if (!probe) return;
			const cell = probe.getBoundingClientRect();
			const cellWidth = cell.width / PROBE_LENGTH;
			if (cellWidth < 1 || cell.height < 1) return;
			const grid = fitGrid(window.innerWidth, window.innerHeight, cellWidth, cell.height);
			cols = grid.cols;
			rows = grid.rows;
		};

		// A new grid size rebuilds every cached buffer and the backdrop, so a drag of the
		// window edge must not do it once per resize event.
		const queueFit = () => {
			if (fitRequest) return;
			fitRequest = requestAnimationFrame(() => {
				fitRequest = 0;
				fit();
			});
		};

		const onPointerMove = (event: PointerEvent) => {
			if (motion.matches) return;
			targetYaw = ((event.clientX / window.innerWidth) * 2 - 1) * MAX_YAW;
			// Negated, so moving the pointer up brings the north pole forward.
			targetPitch = -((event.clientY / window.innerHeight) * 2 - 1) * MAX_PITCH;
		};

		// Only runs when motion is allowed. It paints the turning globe, the moving
		// satellites and the morphing title, throttled to frameMs.
		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			if (startedAt === 0) {
				startedAt = now;
				lastCallback = now;
			}
			const sinceCallback = now - lastCallback;
			lastCallback = now;

			// The callback after a painted frame arrives once that frame is on screen, so
			// the gap is what one frame really costs: our work plus layout and paint. Pace
			// the next frame to that cost, between 30 and 12 per second.
			if (measuring) {
				measuring = false;
				frameCost += (sinceCallback - frameCost) * 0.2;
				if (frameCost > frameMs) frameMs = Math.min(SLOW_FRAME_MS, frameMs * 1.2);
				else if (frameCost < frameMs * 0.5) frameMs = Math.max(FAST_FRAME_MS, frameMs / 1.2);
			}

			// The slack matters: two ticks of a 60Hz display are 33.32 ms, a hair under a
			// 30 per second target, so an exact test skips every other pair and the globe
			// runs at 20 per second instead of 30.
			if (now - paintedAt < frameMs - 2) return;
			paintedAt = now;
			measuring = true;

			const elapsed = now - startedAt;
			const cycle = Math.floor(elapsed / swapMs);
			titleIndex = cycle % titles.length;

			easedYaw += (targetYaw - easedYaw) * 0.08;
			easedPitch += (targetPitch - easedPitch) * 0.08;
			angle = ((elapsed / turnMs) % 1) * 2 * Math.PI + easedYaw;
			pitch = Math.round(easedPitch / PITCH_STEP) * PITCH_STEP;
			clock = elapsed;
			seed = cycle;
			titleProgress = Math.min(1, (elapsed - cycle * swapMs) / morphMs);
		};

		const stop = () => {
			if (request) cancelAnimationFrame(request);
			if (titleTimer) clearInterval(titleTimer);
			request = 0;
			titleTimer = 0;
		};

		// With reduced motion the globe stays still: no rotation, no orbit, no morph. The
		// title still names each site, but it swaps on a slow timer instead of a 30fps
		// animation loop, so the device does no work between swaps.
		const start = () => {
			stop();
			if (motion.matches) {
				angle = 0;
				pitch = 0;
				clock = 0;
				seed = 0;
				titleProgress = 1;
				titleTimer = window.setInterval(() => {
					titleIndex = (titleIndex + 1) % titles.length;
				}, swapMs);
				return;
			}
			startedAt = 0;
			paintedAt = 0;
			frameMs = FAST_FRAME_MS;
			frameCost = FAST_FRAME_MS;
			measuring = false;
			request = requestAnimationFrame(tick);
		};

		fit();
		window.addEventListener('resize', queueFit, { passive: true });
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		// Restart in the other mode when the user flips the reduced-motion setting.
		motion.addEventListener('change', start);
		start();

		return () => {
			stop();
			if (fitRequest) cancelAnimationFrame(fitRequest);
			window.removeEventListener('resize', queueFit);
			window.removeEventListener('pointermove', onPointerMove);
			motion.removeEventListener('change', start);
		};
	});
</script>

<pre class="probe" aria-hidden="true" bind:this={probe}>{'M'.repeat(PROBE_LENGTH)}</pre>
<div class="stack" style:--label-scale={LABEL_SCALE}>
	<pre class="haze" aria-hidden="true">{backdrop.haze}</pre>
	<pre class="dim-stars" aria-hidden="true">{backdrop.dimStars}</pre>
	<pre class="bright-stars" aria-hidden="true">{backdrop.brightStars}</pre>
	<pre class="ocean" aria-hidden="true">{frame.ocean}</pre>
	<pre class="graticule" aria-hidden="true">{frame.graticule}</pre>
	<pre class="land" aria-hidden="true">{frame.land}</pre>
	<pre class="satellites" aria-hidden="true">{frame.satellites}</pre>
	<pre class="label" aria-hidden="true">{frame.label}</pre>
</div>
<p class="reader-only">{titles.join(' / ')} — {subtitle}</p>

<style>
	.stack {
		display: grid;
		isolation: isolate;
	}

	/* Soft bloom behind the globe, on the lit side. Sized in viewport height, like the
	   globe itself, so it stays on the disc instead of spreading over the whole sky. */
	.stack::before {
		content: '';
		grid-area: 1 / 1;
		z-index: -1;
		background: radial-gradient(
			circle 42dvh at 47% 42%,
			rgba(255, 255, 255, 0.1) 0%,
			rgba(255, 255, 255, 0) 62%
		);
	}

	/* Measures one character cell. Out of the flow and invisible. */
	.probe {
		position: absolute;
		top: 0;
		left: 0;
		visibility: hidden;
		pointer-events: none;
	}

	/* Only sets how fine the drawing is. The globe size follows the window height,
	   because the grid does. About 128 rows from Full HD up: at 90 rows the disc read
	   as blocky, and 128 is the density a Full HD screen shows at 50 percent zoom.
	   The floor keeps a small laptop from going under 7px, the cap keeps a 4K screen
	   from getting coarse again.
	   The title is not bound by this, it is drawn larger in its own layer. */
	.probe,
	.stack {
		--cell-size: clamp(7px, 0.65vmin, 11px);
	}

	.probe,
	.stack > pre {
		grid-area: 1 / 1;
		margin: 0;
		/* The renderer assumes a cell twice as high as it is wide. */
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		font-size: var(--cell-size);
		line-height: 1.2;
		letter-spacing: 0;
		white-space: pre;
		user-select: none;
		/* iOS Safari inflates text in a block as wide as the screen. It drew these layers
		   at about twice the size the CSS asks for, so the grid came out half as wide and
		   the title filled the phone edge to edge. Unprefixed first: iOS only reads the
		   -webkit- line, and an unprefixed line after it would undo the fix. */
		text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
		/* Plain ASCII in a monospace face needs no kerning and no ligatures. Turning the
		   lookups off cuts the cost of laying out tens of thousands of glyphs each frame
		   and changes nothing on screen. */
		text-rendering: optimizeSpeed;
		font-kerning: none;
		font-variant-ligatures: none;
		/* Small glyphs pick up colour fringes from subpixel smoothing. Both the hint
		   and the composited layer make the browser fall back to grey smoothing. */
		-webkit-font-smoothing: antialiased;
		transform: translateZ(0);
	}

	.haze {
		color: rgba(255, 255, 255, 0.3);
	}

	.dim-stars {
		color: rgba(255, 255, 255, 0.42);
		animation: twinkle 5.5s ease-in-out infinite alternate;
	}

	/* A second star layer, brighter and on its own beat, so the sky is not flat. */
	.bright-stars {
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 0 0.5em rgba(255, 255, 255, 0.35);
		animation: twinkle 3.3s ease-in-out infinite alternate;
	}

	.satellites {
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 0 0.6em rgba(255, 255, 255, 0.45);
	}

	/* Small glyphs put less ink on the screen, so the dim layers sit a little higher
	   than they would with large cells. Land stays far above both. */
	.ocean {
		color: rgba(255, 255, 255, 0.48);
	}

	.graticule {
		color: rgba(255, 255, 255, 0.3);
	}

	.land {
		color: rgba(255, 255, 255, 0.95);
		text-shadow: 0 0 0.4em rgba(255, 255, 255, 0.2);
	}

	/* Drawn on a coarser grid at a larger size, so the title stays readable when the
	   cells are small. Each label cell lands exactly on a block of grid cells, because
	   the font size scales the line height and the character advance together. */
	.stack > .label {
		font-size: calc(var(--cell-size) * var(--label-scale));
		color: #ffffff;
		text-shadow:
			0 0 0.5em rgba(255, 255, 255, 0.55),
			0 0 1.5em rgba(255, 255, 255, 0.25);
	}

	@keyframes twinkle {
		from {
			opacity: 0.7;
		}
		to {
			opacity: 1;
		}
	}

	/* Readable by a screen reader, invisible on screen. */
	.reader-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.dim-stars,
		.bright-stars {
			animation: none;
		}
	}
</style>
