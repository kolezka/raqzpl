<script lang="ts">
	import AsciiGlobe from '$lib/components/AsciiGlobe.svelte';
	import Colophon from '$lib/components/Colophon.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import StarSky from '$lib/components/StarSky.svelte';
	import { page } from '$app/state';
	import { t, withLang } from '$lib/i18n';
	import { featuredProjects, projectAnchor, projectCounts } from '$lib/projects';
	import type { GlobeMetrics } from '$lib/globe';
	import { jsonLdScript, siteJsonLd } from '$lib/seo';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang));

	let metrics: GlobeMetrics | null = $state(null);
	let heroHeight = $state(0);
	let restHeight = $state(0);
</script>

<PageMeta title={strings.home.title} description={strings.home.description} />

<svelte:head>
	{@html jsonLdScript(siteJsonLd(lang))}
</svelte:head>

<section class="hero" bind:offsetHeight={heroHeight}>
	<div class="globe" data-nosnippet>
		<AsciiGlobe glow={false} showLabel={false} bind:metrics />
	</div>
	<div class="page hero-inner">
		<Masthead />
		<div class="hero-text">
			<h1>{strings.home.heading}</h1>
			<p class="lead">{strings.home.lead}</p>
		</div>
	</div>
</section>

<div class="rest" bind:offsetHeight={restHeight}>
	<StarSky {metrics} {heroHeight} height={restHeight} />
	<div class="page after">
		<h2 class="section">
			<span>{strings.home.selectedWork}</span>
			<a href={withLang(lang, '/projects')}>{strings.home.allProjects(projectCounts.total)}</a>
		</h2>
		<ol class="toc">
			{#each featuredProjects as project, index (project.name)}
				<li>
					<span class="n">{String(index + 1).padStart(2, '0')}</span>
					<a href={withLang(lang, `/projects#${projectAnchor(project.name)}`)}>{project.name}</a>
					<span class="stack">{project.stack.slice(0, 2).join(' · ')}</span>
				</li>
			{/each}
		</ol>
		<Colophon />
	</div>
</div>

<style>
	/* First screen: the globe fills it, masthead on top, heading at the bottom. */
	.hero {
		position: relative;
		min-height: 100svh;
		overflow: hidden;
	}

	/* Cropped, not scrolled: the grid is rounded up to whole characters, so it is a
	   little larger than the window. */
	.globe {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		filter: var(--night-filter);
	}

	.hero-inner {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 100svh;
		padding-bottom: 56px;
	}

	/* Heading and lead each sit on one solid paper block, so the globe never shows
	   between their lines. */
	h1,
	.lead {
		width: fit-content;
		background: var(--bg);
		padding: 0.04em 0.3em 0.08em 0;
	}

	h1 {
		max-width: 100%;
		font-size: clamp(40px, 7vw, 60px);
		line-height: 1.08;
		font-weight: 400;
		letter-spacing: -0.02em;
	}

	.lead {
		max-width: min(100%, 34ch);
		padding-top: 14px;
	}

	.rest {
		position: relative;
	}

	.after {
		position: relative;
		padding-top: 8px;
	}

	.toc li {
		display: grid;
		grid-template-columns: 3ch minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px solid var(--line);
		font: 13px/1.6 var(--mono);
	}

	.n {
		color: var(--faint);
	}

	.toc a {
		overflow-wrap: anywhere;
	}

	.stack {
		font-size: 12px;
		color: var(--faint);
	}

	@media (max-width: 640px) {
		.hero-inner {
			padding-bottom: 40px;
		}

		/* Phones: the paper blocks run edge to edge, with room above the heading. */
		h1,
		.lead {
			width: auto;
			max-width: none;
			margin: 0 -18px;
			padding-left: 18px;
			padding-right: 18px;
		}

		h1 {
			padding-top: 20px;
		}

		.lead {
			padding-bottom: 12px;
		}

		.toc li {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.n {
			display: none;
		}
	}
</style>
