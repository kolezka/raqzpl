<script lang="ts">
	import { page } from '$app/state';
	import { LANGS, t, pathWithoutLang, withLang } from '$lib/i18n';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang));
	// The language-independent tail of the path, so a switch stays on the same page.
	const rest = $derived(pathWithoutLang(page.url.pathname));

	const items = $derived([
		{ href: withLang(lang, ''), label: strings.nav.home },
		{ href: withLang(lang, '/projects'), label: strings.nav.projects },
		{ href: withLang(lang, '/contact'), label: strings.nav.contact }
	]);
</script>

<header class="mast">
	<div class="who">
		Mariusz Rakus
		<small>raqz.pl</small>
	</div>
	<nav aria-label={strings.nav.primary}>
		<ul class="pages">
			{#each items as item (item.href)}
				{@const on = page.url.pathname === item.href}
				<li>
					<a href={item.href} aria-current={on ? 'page' : undefined}>{item.label}</a>
				</li>
			{/each}
		</ul>
		<ul class="langs" aria-label={strings.nav.language}>
			{#each LANGS as code (code)}
				<li>
					<a
						href={withLang(code, rest)}
						aria-current={code === lang ? 'true' : undefined}
						hreflang={code}>{code}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<style>
	.mast {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 24px;
		padding-bottom: 20px;
		border-bottom: 2px solid var(--fg);
	}

	.who {
		font-size: 20px;
		line-height: 1.2;
	}

	.who small {
		display: block;
		margin-top: 4px;
		font: 12px var(--mono);
		color: var(--muted);
	}

	nav {
		display: flex;
		gap: 28px;
		font: 13px/1.6 var(--mono);
	}

	.pages {
		display: grid;
		gap: 4px;
		text-align: right;
	}

	.langs {
		display: flex;
		gap: 6px;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* Each link sits on a frosted chip, so it stays readable over the home globe. */
	a {
		display: inline-block;
		padding: 2px 6px;
		margin: -2px -6px;
		border-radius: 3px;
		color: var(--muted);
		text-decoration: none;
		background: color-mix(in srgb, var(--bg) 72%, transparent);
		-webkit-backdrop-filter: blur(6px);
		backdrop-filter: blur(6px);
	}

	.langs a {
		padding: 2px 3px;
		margin: -2px -3px;
	}

	.langs li + li::before {
		content: '/';
		margin-right: 6px;
		color: var(--faint);
	}

	a:hover {
		color: var(--fg);
	}

	.pages a[aria-current] {
		color: var(--acc);
	}

	.pages a[aria-current]::after {
		content: ' ←';
	}

	.langs a[aria-current] {
		color: var(--fg);
	}

	/* Phones: one frosted glass bar from edge to edge, no rule, plain links. The negative
	   margins cancel the 20px top and 18px side padding of the page column. */
	@media (max-width: 640px) {
		.mast {
			flex-direction: column;
			gap: 12px;
			align-items: stretch;
			margin: -20px -18px 0;
			padding: 16px 18px 14px;
			border-bottom: 0;
			background: color-mix(in srgb, var(--bg) 70%, transparent);
			-webkit-backdrop-filter: blur(10px) saturate(1.1);
			backdrop-filter: blur(10px) saturate(1.1);
		}

		nav {
			justify-content: space-between;
		}

		.pages {
			display: flex;
			gap: 16px;
		}

		a,
		.langs a {
			padding: 6px 0;
			margin: 0;
			border-radius: 0;
			background: none;
			-webkit-backdrop-filter: none;
			backdrop-filter: none;
		}

		.pages a[aria-current] {
			text-decoration: underline;
		}

		.pages a[aria-current]::after {
			content: '';
		}
	}
</style>
