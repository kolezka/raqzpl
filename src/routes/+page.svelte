<script lang="ts">
	import AsciiGlobe from '$lib/components/AsciiGlobe.svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	const strings = $derived(t(page.data.lang));
</script>

<svelte:head>
	<title>{strings.home.title}</title>
	<meta name="description" content={strings.home.description} />
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
