<script lang="ts">
	import { page } from '$app/state';
	import { t, withLang } from '$lib/i18n';

	const domains = ['raqz.pl', 'raqz.dev', 'raqz.link', 'raqz.app', 'raqz.contact'];
	const strings = $derived(t(page.data.lang));
</script>

<p class="colophon">
	{domains.join(' · ')} · <a href={withLang(page.data.lang, '/privacy')}>{strings.consent.policy}</a>
</p>

<style>
	.colophon {
		margin-top: 72px;
		padding-top: 16px;
		border-top: 1px solid var(--line);
		font: 12px var(--mono);
		color: var(--faint);
		overflow-wrap: anywhere;
	}

	.colophon a {
		color: var(--faint);
	}
</style>
