<script lang="ts">
	import AsciiGlobe from '$lib/components/AsciiGlobe.svelte';
</script>

<svelte:head>
	<title>raqz.pl — Mariusz Rakus</title>
	<meta
		name="description"
		content="raqz.pl, raqz.dev, raqz.link, raqz.app, raqz.contact — Mariusz Rakus"
	/>
</svelte:head>

<main>
	<AsciiGlobe />
</main>

<style>
	main {
		display: flex;
		align-items: center;
		justify-content: center;
		/* Fixed height, not a minimum: the grid is rounded up to whole characters, so it
		   is a little taller than the window and must be cropped, not scrolled. */
		height: 100dvh;
		overflow: hidden;
	}
</style>
