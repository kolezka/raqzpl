<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
