<script lang="ts">
	import { onMount } from 'svelte';
	import { AXIAL_TILT, renderBackdrop, renderGlobe } from '$lib/globe';

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
		titles = ['raqz.pl', 'raqz.dev'],
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

	/** Stars and the glow round the disc never move, so they render once. */
	const backdrop = renderBackdrop();

	let angle = $state(0);
	let pitch = $state(0);
	let titleIndex = $state(0);
	let titleProgress = $state(1);
	let seed = $state(0);

	const frame = $derived(
		renderGlobe({
			angle,
			pitch,
			roll: AXIAL_TILT,
			title: titles[titleIndex],
			subtitle,
			titleProgress,
			seed
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
			seed = cycle;
			titleProgress = Math.min(1, (elapsed - cycle * swapMs) / morphMs);
		};

		window.addEventListener('pointermove', onPointerMove, { passive: true });
		request = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(request);
			window.removeEventListener('pointermove', onPointerMove);
		};
	});
</script>

<div class="stack">
	<pre class="backdrop" aria-hidden="true">{backdrop}</pre>
	<pre class="ocean" aria-hidden="true">{frame.ocean}</pre>
	<pre class="graticule" aria-hidden="true">{frame.graticule}</pre>
	<pre class="land" aria-hidden="true">{frame.land}</pre>
	<pre class="label" aria-hidden="true">{frame.label}</pre>
</div>
<p class="reader-only">{titles.join(' / ')} — {subtitle}</p>

<style>
	.stack {
		display: grid;
		isolation: isolate;
	}

	/* Soft bloom behind the globe, on the lit side. */
	.stack::before {
		content: '';
		grid-area: 1 / 1;
		z-index: -1;
		background: radial-gradient(
			circle at 40% 34%,
			rgba(255, 255, 255, 0.1) 0%,
			rgba(255, 255, 255, 0) 46%
		);
	}

	.stack > pre {
		grid-area: 1 / 1;
		margin: 0;
		/* The renderer assumes a cell twice as high as it is wide. */
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		font-size: clamp(2px, 1.42vmin, 20px);
		line-height: 1.2;
		letter-spacing: 0;
		white-space: pre;
		user-select: none;
		/* Small glyphs pick up colour fringes from subpixel smoothing. Both the hint
		   and the composited layer make the browser fall back to grey smoothing. */
		-webkit-font-smoothing: antialiased;
		transform: translateZ(0);
	}

	.backdrop {
		color: rgba(255, 255, 255, 0.3);
		animation: twinkle 5.5s ease-in-out infinite alternate;
	}

	.ocean {
		color: rgba(255, 255, 255, 0.38);
	}

	.graticule {
		color: rgba(255, 255, 255, 0.22);
	}

	.land {
		color: rgba(255, 255, 255, 0.95);
		text-shadow: 0 0 0.4em rgba(255, 255, 255, 0.2);
	}

	.label {
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
		.backdrop {
			animation: none;
		}
	}
</style>
