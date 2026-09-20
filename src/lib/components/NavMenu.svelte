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

	// The language is in the URL, so a switch is just a link to the same page under the
	// other language. Every nav link carries the prefix, so language is fully URL-driven.
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
				<a
					href={withLang(code, rest)}
					class:active={code === lang}
					aria-current={code === lang ? 'true' : undefined}
					hreflang={code}>{code}</a
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

	/* Below this width the page text runs the full window, so a nav stacked in the
	   corner sits on top of the heading. Fold it into one bar across the top. The
	   width is where a centred 44rem column still clears the stacked nav. */
	@media (max-width: 959px) {
		.nav {
			top: 0;
			left: 0;
			right: 0;
			box-sizing: border-box;
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 1em;
			padding: 0.6rem 0.9rem 1.2rem;
			/* Shrinks with the window so the bar stays on one line down to 320px. Every
			   size below is in em, so the whole bar scales with it. */
			font-size: clamp(0.68rem, 3.4vw, 0.8rem);
			/* Fades out instead of ending on a hard edge, which would cut a line across
			   the globe on the home page. */
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.92) 55%, rgba(0, 0, 0, 0));
			/* iOS Safari inflates text in a block as wide as the screen, same trap as the
			   globe grid. Unprefixed first: iOS only reads the -webkit- line. */
			text-size-adjust: 100%;
			-webkit-text-size-adjust: 100%;
		}

		.brand {
			margin-bottom: 0;
			font-size: 0.9em;
		}

		ul {
			display: flex;
			gap: 1em;
		}

		.langs {
			margin-top: 0;
			margin-left: auto;
			padding-left: 0;
			gap: 0.6em;
			font-size: 0.85em;
		}

		/* A bar link is one line of small text, too little to hit with a thumb. The
		   negative margin keeps the taller hit area from making the bar taller. */
		a {
			padding: 0.6em 0.2em;
			margin: -0.6em -0.2em;
		}

		/* The caret needs a column of its own. On one line the colour marks the page. */
		.mark {
			display: none;
		}
	}
</style>
