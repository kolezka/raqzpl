<script lang="ts">
	import { onMount } from 'svelte';

	// Full-screen ASCII scramble used between routes. `cover()` fills the screen with
	// dissolving glyphs and resolves once it is fully opaque, so SvelteKit can swap the
	// DOM hidden behind it. `reveal()` then dissolves the cover away.

	/** Glyphs the scramble flickers through. Same family as the globe title morph. */
	const GLYPHS = '#@%*+=~-:.$&?/|<>01xX';
	const COVER_MS = 420;
	const REVEAL_MS = 560;

	let cols = $state(0);
	let rows = $state(0);
	/** Coverage, 0 clear to 1 fully covered. */
	let fill = $state(0);
	let active = $state(false);
	/** Frame counter, drives the per-cell glyph flicker. */
	let tick = $state(0);
	/** Re-rolled per transition so the dissolve pattern changes each time. */
	let seedA = 1;
	let seedB = 1;
	/** True between cover() and the end of reveal(), so reveal is a no-op otherwise. */
	let covered = false;
	let raf = 0;

	function prefersReduced(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Fixed 14px cell, so the grid does not need a measured probe. A slight overshoot
	// plus overflow:hidden guarantees the scramble reaches every edge.
	function measure() {
		const fontSize = 14;
		const cellWidth = fontSize * 0.62;
		const cellHeight = fontSize * 1.2;
		cols = Math.ceil(window.innerWidth / cellWidth) + 1;
		rows = Math.ceil(window.innerHeight / cellHeight) + 1;
	}

	/** Stable pseudo random number in [0, 1) for a pair of integers. */
	function hash(a: number, b: number): number {
		let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
	}

	// Each cell has a fixed threshold; it turns to a glyph once `fill` passes it. That
	// makes the screen fill and clear as an organic dissolve instead of a flat fade.
	const grid = $derived.by(() => {
		if (!active || cols === 0 || rows === 0) return '';
		const lines = new Array<string>(rows);
		for (let r = 0; r < rows; r++) {
			let line = '';
			for (let c = 0; c < cols; c++) {
				const threshold = hash(c * seedA + r * 7, r * seedB + c * 13);
				if (threshold < fill) {
					line += GLYPHS[Math.floor(hash(c + tick * 131, r - tick * 57) * GLYPHS.length)];
				} else {
					line += ' ';
				}
			}
			lines[r] = line;
		}
		return lines.join('\n');
	});

	export function cover(): Promise<void> {
		if (raf) cancelAnimationFrame(raf);
		seedA = 1 + ((Math.random() * 997) | 0);
		seedB = 1 + ((Math.random() * 997) | 0);
		active = true;
		covered = true;
		if (prefersReduced()) {
			fill = 1;
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			const start = performance.now();
			const loop = (now: number) => {
				const progress = Math.min(1, (now - start) / COVER_MS);
				fill = progress;
				tick++;
				if (progress < 1) {
					raf = requestAnimationFrame(loop);
				} else {
					raf = 0;
					resolve();
				}
			};
			raf = requestAnimationFrame(loop);
		});
	}

	export function reveal(): void {
		if (!covered) return;
		covered = false;
		if (raf) cancelAnimationFrame(raf);
		if (prefersReduced()) {
			active = false;
			fill = 0;
			return;
		}
		const start = performance.now();
		const loop = (now: number) => {
			const progress = Math.min(1, (now - start) / REVEAL_MS);
			fill = 1 - progress;
			tick++;
			if (progress < 1) {
				raf = requestAnimationFrame(loop);
			} else {
				raf = 0;
				active = false;
				fill = 0;
			}
		};
		raf = requestAnimationFrame(loop);
	}

	onMount(() => {
		measure();
		window.addEventListener('resize', measure, { passive: true });
		return () => {
			window.removeEventListener('resize', measure);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<div
	class="overlay"
	class:active
	aria-hidden="true"
	style:background={`rgba(0, 0, 0, ${active ? fill : 0})`}
>
	<pre>{grid}</pre>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		overflow: hidden;
		pointer-events: none;
		visibility: hidden;
	}

	.overlay.active {
		visibility: visible;
	}

	.overlay pre {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		font-size: 14px;
		line-height: 1.2;
		letter-spacing: 0;
		white-space: pre;
		user-select: none;
		color: rgba(255, 255, 255, 0.92);
		text-shadow: 0 0 0.4em rgba(255, 255, 255, 0.25);
	}
</style>
