<script lang="ts">
	// Placeholder contact details — replace with the real handles.
	const channels = [
		{ label: 'email', value: 'hello@raqz.pl', href: 'mailto:hello@raqz.pl' },
		{ label: 'github', value: 'github.com/raqz', href: 'https://github.com/raqz' },
		{ label: 'x', value: '@raqz', href: 'https://x.com/raqz' },
		{ label: 'linkedin', value: 'in/raqz', href: 'https://www.linkedin.com/in/raqz' }
	];

	const domains = ['raqz.pl', 'raqz.dev', 'raqz.link', 'raqz.app', 'raqz.contact'];
</script>

<svelte:head>
	<title>contact — raqz.pl</title>
	<meta name="description" content="Contact Mariusz Rakus" />
</svelte:head>

<section class="view">
	<div class="view-inner">
		<h1>contact</h1>
		<p class="lead">Reach me on any of these.</p>

		<ul class="rows">
			{#each channels as channel (channel.label)}
				<li>
					<span class="k">{channel.label}</span>
					<a class="link" href={channel.href} target="_blank" rel="noreferrer">{channel.value}</a>
				</li>
			{/each}
		</ul>

		<p class="domains muted">{domains.join('  ·  ')}</p>
	</div>
</section>

<style>
	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		display: flex;
		gap: 1.5rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.k {
		width: 6rem;
		align-self: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.domains {
		margin-top: 2rem;
		font-size: 0.85rem;
	}
</style>
