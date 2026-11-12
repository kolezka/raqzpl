<script lang="ts">
	import { renderSkyRows, type GlobeMetrics } from '$lib/globe';

	interface Props {
		/** Grid of the globe above, as AsciiGlobe measured it. Nothing is drawn until it is known. */
		metrics: GlobeMetrics | null;
		/** Height of the box the globe is centred in, in CSS pixels. */
		heroHeight: number;
		/** Height to fill below the hero, in CSS pixels. */
		height: number;
	}

	let { metrics, heroHeight, height }: Props = $props();

	let width = $state(0);

	// The globe grid is centred in the hero and overflows it. The sky picks up at the first
	// grid row below the hero and keeps the same columns, so its stars line up with the
	// globe's own backdrop.
	const sky = $derived.by(() => {
		if (!metrics || heroHeight <= 0 || height <= 0 || width <= 0) return null;
		const { cols, rows, cellWidth, cellHeight, fontPx } = metrics;
		const gridTop = (heroHeight - rows * cellHeight) / 2;
		const firstRow = Math.ceil((heroHeight - gridTop) / cellHeight);
		const count = Math.ceil(height / cellHeight) + 2;
		const stars = renderSkyRows(cols, rows, firstRow, count);
		return {
			...stars,
			top: gridTop + firstRow * cellHeight - heroHeight,
			left: (width - cols * cellWidth) / 2,
			fontPx
		};
	});
</script>

<div class="sky" aria-hidden="true" bind:clientWidth={width}>
	{#if sky}
		<pre class="dim" style:top="{sky.top}px" style:left="{sky.left}px" style:font-size="{sky.fontPx}px"
			>{sky.dimStars}</pre>
		<pre class="bright" style:top="{sky.top}px" style:left="{sky.left}px" style:font-size="{sky.fontPx}px"
			>{sky.brightStars}</pre>
	{/if}
</div>

<style>
	.sky {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		filter: var(--night-filter);
	}

	/* Same text setup and colours as the star layers in AsciiGlobe, so the seam does not show. */
	pre {
		position: absolute;
		margin: 0;
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		line-height: 1.2;
		letter-spacing: 0;
		white-space: pre;
		user-select: none;
		text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
		font-kerning: none;
		font-variant-ligatures: none;
		-webkit-font-smoothing: antialiased;
	}

	.dim {
		color: rgba(255, 255, 255, 0.42);
		animation: twinkle 5.5s ease-in-out infinite alternate;
	}

	.bright {
		color: rgba(255, 255, 255, 0.85);
		animation: twinkle 3.3s ease-in-out infinite alternate;
	}

	@keyframes twinkle {
		from {
			opacity: 0.7;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dim,
		.bright {
			animation: none;
		}
	}
</style>
