<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AXIAL_TILT,
		DEFAULT_COLS,
		DEFAULT_ROWS,
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

	/** Frames per second. Lower than the display rate, because the globe is coarse. */
	const FRAME_MS = 1000 / 30;

	/** How far the pointer tips the globe, in radians. */
	const MAX_PITCH = 0.3;
	const MAX_YAW = 0.32;

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
		let startedAt = 0;
		let paintedAt = 0;
		let targetPitch = 0;
		let targetYaw = 0;
		let easedPitch = 0;
		let easedYaw = 0;

		// The grid covers the whole window: stars reach both edges on a wide screen, and
		// the globe, which keeps nine tenths of the grid height, fills a tall phone.
		// Rounded up to whole label cells, so the label grid is exactly as large.
		const fit = () => {
			if (!probe) return;
			const cell = probe.getBoundingClientRect();
			const cellWidth = cell.width / PROBE_LENGTH;
			if (cellWidth < 1 || cell.height < 1) return;
			cols = Math.ceil(window.innerWidth / cellWidth / LABEL_SCALE) * LABEL_SCALE;
			rows = Math.ceil(window.innerHeight / cell.height / LABEL_SCALE) * LABEL_SCALE;
		};

		const onPointerMove = (event: PointerEvent) => {
			if (motion.matches) return;
			targetYaw = ((event.clientX / window.innerWidth) * 2 - 1) * MAX_YAW;
			// Negated, so moving the pointer up brings the north pole forward.
			targetPitch = -((event.clientY / window.innerHeight) * 2 - 1) * MAX_PITCH;
		};

		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			if (startedAt === 0) startedAt = now;
			if (now - paintedAt < FRAME_MS) return;
			paintedAt = now;

			const elapsed = now - startedAt;
			const cycle = Math.floor(elapsed / swapMs);
			titleIndex = cycle % titles.length;

			if (motion.matches) {
				titleProgress = 1;
				return;
			}

			easedYaw += (targetYaw - easedYaw) * 0.08;
			easedPitch += (targetPitch - easedPitch) * 0.08;
			angle = ((elapsed / turnMs) % 1) * 2 * Math.PI + easedYaw;
			pitch = easedPitch;
			clock = elapsed;
			seed = cycle;
			titleProgress = Math.min(1, (elapsed - cycle * swapMs) / morphMs);
		};

		fit();
		window.addEventListener('resize', fit, { passive: true });
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		request = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(request);
			window.removeEventListener('resize', fit);
			window.removeEventListener('pointermove', onPointerMove);
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
	   because the grid does. About 90 rows from Full HD up, which is fine enough for
	   the coastlines to read; the cap keeps a 4K screen from getting coarse again.
	   The title is not bound by this, it is drawn larger in its own layer. */
	.probe,
	.stack {
		--cell-size: clamp(9px, 0.9vmin, 14px);
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
