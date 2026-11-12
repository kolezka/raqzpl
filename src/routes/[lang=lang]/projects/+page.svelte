<script lang="ts">
	import { page } from '$app/state';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { t } from '$lib/i18n';
	import { projectAnchor, projectCounts, projects } from '$lib/projects';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang));
</script>

<PageMeta title={strings.projects.title} description={strings.projects.description} />

<h1 class="page-title">{strings.projects.heading}</h1>
<p class="lead">{strings.projects.lead}</p>
<p class="counts mono">
	{strings.projects.counts(projectCounts.total, projectCounts.withSource, projectCounts.live)}
</p>

<h2 class="section"><span>{strings.projects.allWork}</span></h2>
{#each projects as project, index (project.name)}
	<article class="entry" id={projectAnchor(project.name)}>
		<span class="n">{String(index + 1).padStart(2, '0')}</span>
		<div>
			<h3>{project.name}</h3>
			<p>{project.tagline[lang]}</p>
			<div class="meta">
				<span>{project.stack.join(' · ')}</span>
				{#if project.live}
					<a href={project.live} target="_blank" rel="noreferrer">{strings.projects.live} ↗</a>
				{/if}
				{#if project.href}
					<a href={project.href} target="_blank" rel="noreferrer">{strings.projects.code} ↗</a>
				{:else}
					<span class="private">{strings.projects.private}</span>
				{/if}
			</div>
		</div>
	</article>
{/each}

<style>
	.counts {
		margin-top: 16px;
		font-size: 12px;
		color: var(--muted);
	}

	.entry {
		display: grid;
		grid-template-columns: 3ch minmax(0, 1fr);
		gap: 16px;
		padding: 28px 0;
		border-bottom: 1px solid var(--line);
		scroll-margin-top: 24px;
	}

	.n {
		padding-top: 8px;
		font: 12px var(--mono);
		color: var(--faint);
	}

	h3 {
		font-size: 26px;
		font-weight: 400;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere;
	}

	.entry p {
		margin-top: 8px;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		margin-top: 12px;
		font: 12px/1.6 var(--mono);
		color: var(--muted);
	}

	.private {
		color: var(--faint);
	}

	@media (max-width: 640px) {
		.entry {
			grid-template-columns: 1fr;
			gap: 4px;
		}

		.n {
			padding-top: 0;
		}
	}
</style>
