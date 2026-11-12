<script lang="ts">
	import { page } from '$app/state';
	import Colophon from '$lib/components/Colophon.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import { LANGS, SITE_URL, pathWithoutLang } from '$lib/i18n';
	import { SITE_NAME, alternateLinks, ogLocale, samePath } from '$lib/seo';

	let { children } = $props();

	// The language-independent tail of the path, e.g. `/projects` or `` for the home page.
	const rest = $derived(pathWithoutLang(page.url.pathname));
	// Pages with a different path per language pass their own.
	const paths = $derived(page.data.paths ?? samePath(rest));
	const canonical = $derived(`${SITE_URL}/${page.data.lang}${paths[page.data.lang]}`);
	// Home sets its masthead over the globe itself; the text pages share this column.
	const isHome = $derived(rest === '');

	// A client navigation between languages does not re-render the document element, so
	// keep its `lang` in step for assistive tech and the browser.
	$effect(() => {
		document.documentElement.lang = page.data.lang;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
	{#each alternateLinks(paths) as link (link.hreflang)}
		<link rel="alternate" hreflang={link.hreflang} href={link.href} />
	{/each}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={ogLocale(page.data.lang)} />
	{#each LANGS.filter((code) => code !== page.data.lang) as code (code)}
		<meta property="og:locale:alternate" content={ogLocale(code)} />
	{/each}
	<meta name="twitter:card" content="summary" />
</svelte:head>

{#if isHome}
	{@render children()}
{:else}
	<div class="page">
		<Masthead />
		{@render children()}
		<Colophon />
	</div>
{/if}
