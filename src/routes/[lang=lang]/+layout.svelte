<script lang="ts">
	import { page } from '$app/state';
	import NavMenu from '$lib/components/NavMenu.svelte';
	import { LANGS, DEFAULT_LANG, SITE_URL, pathWithoutLang } from '$lib/i18n';

	let { children } = $props();

	// The language-independent tail of the path, e.g. `/projects` or `` for the home page.
	const rest = $derived(pathWithoutLang(page.url.pathname));
	const canonical = $derived(`${SITE_URL}/${page.data.lang}${rest}`);

	// A client navigation between languages does not re-render the document element, so
	// keep its `lang` in step for assistive tech and the browser.
	$effect(() => {
		document.documentElement.lang = page.data.lang;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
	{#each LANGS as code (code)}
		<link rel="alternate" hreflang={code} href={`${SITE_URL}/${code}${rest}`} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={`${SITE_URL}/${DEFAULT_LANG}${rest}`} />
</svelte:head>

<NavMenu />
{@render children()}
