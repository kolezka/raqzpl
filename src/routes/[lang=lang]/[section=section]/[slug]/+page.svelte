<script lang="ts">
	import { page } from '$app/state';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import ServiceCta from '$lib/components/ServiceCta.svelte';
	import { SITE_URL, t, withLang } from '$lib/i18n';
	import { projectAnchor, projects } from '$lib/projects';
	import { jsonLdScript, serviceJsonLd } from '$lib/seo';
	import { servicePaths, services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang).services);
	const copy = $derived(data.service.copy[lang]);
	const related = $derived(projects.filter((project) => data.service.projects.includes(project.name)));
	const others = $derived(services.filter((service) => service.id !== data.service.id));
	const url = $derived(`${SITE_URL}/${lang}${data.paths[lang]}`);
</script>

<PageMeta title={copy.title} description={copy.description} />

<svelte:head>
	{@html jsonLdScript(serviceJsonLd(copy.heading, copy.description, url))}
</svelte:head>

<p class="crumb mono"><a href={withLang(lang, servicePaths()[lang])}>{strings.heading}</a> /</p>
<h1 class="page-title">{copy.heading}</h1>
<p class="lead">{copy.lead}</p>

<h2 class="section"><span>{strings.offer}</span></h2>
<ul class="points">
	{#each copy.offer as item (item)}
		<li>{item}</li>
	{/each}
</ul>

<h2 class="section"><span>{strings.approach}</span></h2>
<ul class="points">
	{#each copy.approach as item (item)}
		<li>{item}</li>
	{/each}
</ul>

{#if related.length}
	<h2 class="section"><span>{strings.examples}</span></h2>
	{#each related as project (project.name)}
		<article class="entry">
			<h3>
				<a href={project.href ?? `${withLang(lang, '/projects')}#${projectAnchor(project.name)}`}
					>{project.name}</a
				>
			</h3>
			<p>{project.tagline[lang]}</p>
		</article>
	{/each}
{/if}

<ServiceCta />

<h2 class="section"><span>{strings.more}</span></h2>
<ul class="points">
	{#each others as other (other.id)}
		<li><a href={withLang(lang, servicePaths(other)[lang])}>{other.copy[lang].heading}</a></li>
	{/each}
</ul>

<style>
	.crumb {
		margin-top: 56px;
		font-size: 13px;
		color: var(--muted);
	}

	.crumb + :global(.page-title) {
		margin-top: 8px;
	}

	.points li {
		position: relative;
		padding: 12px 0 12px 24px;
		border-bottom: 1px solid var(--line);
	}

	.points li::before {
		content: '·';
		position: absolute;
		left: 4px;
		color: var(--acc);
	}

	.entry {
		padding: 24px 0;
		border-bottom: 1px solid var(--line);
	}

	h3 {
		font-size: 24px;
		font-weight: 400;
	}

	.entry p {
		margin-top: 8px;
		font-size: 16px;
		color: var(--muted);
	}

	@media (max-width: 640px) {
		.crumb {
			margin-top: 36px;
		}
	}
</style>
