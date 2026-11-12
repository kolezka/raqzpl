<script lang="ts">
	// Title and description for one page, repeated for link previews (Open Graph, X).
	// The URL-level tags (canonical, hreflang, og:url, og:locale) live in the [lang] layout.
	let { title, description }: { title: string; description: string } = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>
