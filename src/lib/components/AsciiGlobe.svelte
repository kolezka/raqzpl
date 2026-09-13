<script lang="ts">
	import { onMount } from 'svelte';
	import { renderGlobe } from '$lib/globe';

	interface Props {
		/** Titles shown in the middle of the globe, one after the other. */
		titles?: string[];
		/** Line below the title. */
		subtitle?: string;
		/** Time for one full turn, in milliseconds. */
		turnMs?: number;
		/** Time each title stays on screen, in milliseconds. */
		swapMs?: number;
	}

	let {
		titles = ['raqz.pl', 'raqz.dev'],
		subtitle = 'Mariusz Rakus',
		turnMs = 26000,
		swapMs = 2800
	}: Props = $props();

	/** Frames per second. Lower than the display rate, because the globe is coarse. */
	const FRAME_MS = 1000 / 24;

	let angle = $state(0);
	let titleIndex = $state(0);

	const frame = $derived(renderGlobe(angle, titles[titleIndex], subtitle));

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let request = 0;
		let startedAt = 0;
		let paintedAt = 0;

		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			if (startedAt === 0) startedAt = now;
			if (now - paintedAt < FRAME_MS) return;
			paintedAt = now;

			const elapsed = now - startedAt;
			if (!motion.matches) angle = ((elapsed / turnMs) % 1) * 2 * Math.PI;
			titleIndex = Math.floor(elapsed / swapMs) % titles.length;
		};

		request = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(request);
	});
</script>

<pre aria-hidden="true">{frame}</pre>
<p class="label">{titles.join(' / ')} — {subtitle}</p>

<style>
	pre {
		margin: 0;
		/* The renderer assumes a cell twice as high as it is wide. */
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		font-size: clamp(3px, 1.6vmin, 22px);
		line-height: 1.2;
		letter-spacing: 0;
		color: #ffffff;
		white-space: pre;
		user-select: none;
		/* Small glyphs get colour fringes with subpixel smoothing. */
		-webkit-font-smoothing: antialiased;
	}

	/* Readable by a screen reader, invisible on screen. */
	.label {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
