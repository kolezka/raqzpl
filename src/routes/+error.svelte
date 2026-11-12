<script lang="ts">
	import { page } from '$app/state';
	import { DEFAULT_LANG, isLang, t, withLang } from '$lib/i18n';

	const lang = $derived(isLang(page.data.lang) ? page.data.lang : DEFAULT_LANG);
	const strings = $derived(t(lang).error);
	const message = $derived(page.status === 404 ? strings.notFound : strings.generic);
</script>

<svelte:head>
	<title>{page.status} · raqz.pl</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="error">
	<h1>{page.status}</h1>
	<p>{message}</p>
	<p><a href={withLang(lang, '')}>{strings.back}</a></p>
</main>

<style>
	.error {
		max-width: 40rem;
		margin: 0 auto;
		padding: 6rem 16px;
	}

	h1 {
		font: 400 3rem/1.1 var(--mono);
		color: var(--acc);
		margin-bottom: 1rem;
	}

	p + p {
		margin-top: 1rem;
	}
</style>
