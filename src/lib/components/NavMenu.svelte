<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{ href: '/', label: 'home' },
		{ href: '/projects', label: 'projects' },
		{ href: '/contact', label: 'contact' }
	];
</script>

<nav class="nav" aria-label="Primary">
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
