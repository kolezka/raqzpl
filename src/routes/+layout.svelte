<script lang="ts">
	import { onNavigate, afterNavigate } from '$app/navigation';
	import AsciiTransition from '$lib/components/AsciiTransition.svelte';

	let { children } = $props();
	let transition: AsciiTransition | undefined = $state();

	// Cover the screen with an ASCII scramble before the DOM swaps, then dissolve it
	// once the new page is mounted. `onNavigate` holds the swap until cover() resolves,
	// so no page flashes through. Neither hook fires on the first load, so the globe
	// still appears with no transition.
	onNavigate(() => transition?.cover());
	afterNavigate(() => transition?.reveal());
</script>

<svelte:head>
	<!-- A real URL, not an inlined data URI: Google only shows crawlable favicons. -->
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<script defer src="https://umami.raqz.link/script.js" data-website-id="0172159a-2bdd-4c0c-9f10-65ed67c2f9a7"></script>
	<script defer src="https://umami.raqz.link/recorder.js" data-website-id="0172159a-2bdd-4c0c-9f10-65ed67c2f9a7"></script>
</svelte:head>

{@render children()}
<AsciiTransition bind:this={transition} />

<style>
	/* Paper design system, see .design/design-system.md. Warm ink by default, paper in light mode. */
	:global(:root) {
		color-scheme: dark;
		--bg: #16140f;
		--fg: #ece5d6;
		--muted: #a69d8b;
		--faint: #6b6456;
		--line: #37322a;
		--acc: #e3825a;
		--err: #f0937e;
		--field: #1d1a14;
		--serif: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
		--mono: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		/* The globe draws white glyphs. Light mode turns them to ink with this filter. */
		--night-filter: none;
	}

	@media (prefers-color-scheme: light) {
		:global(:root) {
			color-scheme: light;
			--bg: #f4efe4;
			--fg: #1f1c17;
			--muted: #655e52;
			--faint: #9b9384;
			--line: #d9d0bd;
			--acc: #b2431b;
			--err: #a3261a;
			--field: #fbf8f1;
			--night-filter: invert(1);
		}
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--fg);
	}

	:global(body) {
		font: 17px/1.6 var(--serif);
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(h1, h2, h3, p, ul, ol, dl, dd) {
		margin: 0;
		padding: 0;
	}

	:global(ul, ol) {
		list-style: none;
	}

	:global(a) {
		color: var(--fg);
		text-decoration: underline;
		text-decoration-color: var(--faint);
		text-underline-offset: 3px;
	}

	:global(a:hover) {
		color: var(--acc);
		text-decoration-color: var(--acc);
	}

	:global(a:focus-visible, button:focus-visible) {
		outline: 2px solid var(--acc);
		outline-offset: 3px;
	}

	/* One reading column, shared by every page. */
	:global(.page) {
		max-width: 720px;
		margin: 0 auto;
		padding: 48px 24px 96px;
	}

	:global(.page-title) {
		margin: 56px 0 16px;
		font-size: clamp(40px, 7vw, 60px);
		line-height: 1.04;
		font-weight: 400;
		letter-spacing: -0.02em;
	}

	:global(.lead) {
		max-width: 32ch;
		font-size: 20px;
		color: var(--muted);
	}

	:global(.mono) {
		font-family: var(--mono);
	}

	/* Section heading: small caps-like mono label with a rule under it. */
	:global(.section) {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		margin: 64px 0 0;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--line);
		font: 400 13px/1.6 var(--mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	:global(.section a) {
		letter-spacing: 0;
		text-transform: none;
	}

	@media (max-width: 640px) {
		:global(.page) {
			padding: 20px 18px 72px;
		}

		:global(.page-title) {
			margin-top: 36px;
		}
	}
</style>
