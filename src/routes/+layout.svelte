<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import NavMenu from '$lib/components/NavMenu.svelte';
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
	<link rel="icon" href={favicon} />
	<script defer src="https://umami.raqz.link/script.js" data-website-id="0172159a-2bdd-4c0c-9f10-65ed67c2f9a7"></script>
</svelte:head>

<NavMenu />
{@render children()}
<AsciiTransition bind:this={transition} />

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #000000;
		color: #ffffff;
	}

	:global(body) {
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
	}

	/* Shared shell for the text views (projects, contact). The globe page does not use
	   it: it fills the window itself. */
	:global(.view) {
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		min-height: 100dvh;
		padding: 7rem 1.5rem 4rem;
	}

	:global(.view-inner) {
		width: 100%;
		max-width: 44rem;
	}

	:global(.view h1) {
		margin: 0 0 0.25rem;
		font-size: 1.6rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-shadow: 0 0 0.6em rgba(255, 255, 255, 0.35);
	}

	:global(.view .lead) {
		margin: 0 0 2rem;
		color: rgba(255, 255, 255, 0.5);
	}

	:global(.view a.link) {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.25);
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	:global(.view a.link:hover) {
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.7);
	}

	:global(.view .muted) {
		color: rgba(255, 255, 255, 0.4);
	}
</style>
