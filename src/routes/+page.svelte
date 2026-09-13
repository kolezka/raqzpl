<script lang="ts">
	import AsciiGlobe from '$lib/components/AsciiGlobe.svelte';
</script>

<svelte:head>
	<title>raqz.pl — Mariusz Rakus</title>
	<meta name="description" content="raqz.pl / raqz.dev — Mariusz Rakus" />
</svelte:head>

<main>
	<AsciiGlobe />
</main>

<style>
	main {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		overflow: hidden;
	}
</style>
