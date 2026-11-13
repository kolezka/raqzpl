<script lang="ts">
	import { page } from '$app/state';
	import { t, withLang } from '$lib/i18n';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang).services);
</script>

<h2 class="section"><span>{strings.start}</span></h2>
<p class="cta">
	{strings.cta}
	<a href={withLang(lang, '/contact')}>{strings.ctaLink}</a>
</p>

<style>
	.cta {
		margin-top: 20px;
		font-size: 20px;
	}

	.cta a {
		white-space: nowrap;
	}
</style>
