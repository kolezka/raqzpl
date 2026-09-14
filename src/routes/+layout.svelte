<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script defer src="https://umami.raqz.link/script.js" data-website-id="0172159a-2bdd-4c0c-9f10-65ed67c2f9a7"></script>
</svelte:head>

{@render children()}

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
</style>
