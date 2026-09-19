<script lang="ts">
	import { page } from '$app/state';
	import { LANGS, LANG_PARAM, t, type Lang } from '$lib/i18n';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang));

	const items = $derived([
		{ href: '/', label: strings.nav.home },
		{ href: '/projects', label: strings.nav.projects },
		{ href: '/contact', label: strings.nav.contact }
	]);

	// Keeps the visitor on the same page, only with the language parameter. The
	// server stores the choice in a cookie and redirects the parameter away.
	function langHref(code: Lang): string {
		const target = new URL(page.url);
		target.searchParams.set(LANG_PARAM, code);
		return `${target.pathname}${target.search}`;
	}
</script>

<nav class="nav" aria-label={strings.nav.primary}>
	<span class="brand">raqz<span class="cursor">_</span></span>
	<ul>
		{#each items as item (item.href)}
			{@const on = page.url.pathname === item.href}
			<li>
				<a href={item.href} class:active={on} aria-current={on ? 'page' : undefined}>
					<span class="mark">{on ? '>' : ' '}</span>{item.label}
				</a>
			</li>
		{/each}
	</ul>
	<ul class="langs" aria-label={strings.nav.language}>
		{#each LANGS as code (code)}
			<li>
				<!-- A full page load, so the new cookie also reaches the `lang` attribute
				     of the document and the server rendered markup. -->
				<a
					href={langHref(code)}
					class:active={code === lang}
					aria-current={code === lang ? 'true' : undefined}
					hreflang={code}
					data-sveltekit-reload>{code}</a
				>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.nav {
		position: fixed;
		top: 1.1rem;
		left: 1.2rem;
		z-index: 50;
		font-family: ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
		font-size: 0.9rem;
		line-height: 1.5;
		user-select: none;
	}

	.brand {
		display: block;
		margin-bottom: 0.5rem;
		color: rgba(255, 255, 255, 0.95);
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		text-shadow: 0 0 0.5em rgba(255, 255, 255, 0.35);
	}

	.cursor {
		animation: blink 1.1s step-end infinite;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.langs {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.6rem;
		padding-left: 1ch;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.langs a {
		color: rgba(255, 255, 255, 0.35);
	}

	.langs a.active {
		color: rgba(255, 255, 255, 0.9);
	}

	a {
		display: inline-block;
		color: rgba(255, 255, 255, 0.45);
		text-decoration: none;
		white-space: pre;
		transition: color 0.15s ease;
	}

	a:hover {
		color: rgba(255, 255, 255, 0.85);
	}

	a.active {
		color: rgba(255, 255, 255, 1);
		text-shadow: 0 0 0.5em rgba(255, 255, 255, 0.4);
	}

	.mark {
		display: inline-block;
		width: 1ch;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor {
			animation: none;
		}
	}
</style>
