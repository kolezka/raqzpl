<script lang="ts">
	import { page } from '$app/state';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import ServiceCta from '$lib/components/ServiceCta.svelte';
	import { t, withLang } from '$lib/i18n';
	import { servicePaths, services } from '$lib/services';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang).services);
</script>

<PageMeta title={strings.title} description={strings.description} />

<h1 class="page-title">{strings.heading}</h1>
<p class="lead">{strings.lead}</p>

<h2 class="section"><span>{strings.list}</span></h2>
{#each services as service (service.id)}
	<article class="entry">
		<h3><a href={withLang(lang, servicePaths(service)[lang])}>{service.copy[lang].heading}</a></h3>
		<p>{service.copy[lang].lead}</p>
	</article>
{/each}

<ServiceCta />

<style>
	.entry {
		padding: 28px 0;
		border-bottom: 1px solid var(--line);
	}

	h3 {
		font-size: 26px;
		font-weight: 400;
		letter-spacing: -0.01em;
	}

	.entry p {
		margin-top: 8px;
	}
</style>
