<script lang="ts">
	// Placeholder content — replace with the real projects.
	const projects = [
		{
			name: 'ascii-globe',
			tagline: 'Server-rendered spinning ASCII Earth that fronts raqz.pl.',
			stack: ['svelte 5', 'typescript', 'vite'],
			href: 'https://raqz.pl'
		},
		{
			name: 'project-two',
			tagline: 'One line about what it does and why it exists.',
			stack: ['rust', 'wasm'],
			href: ''
		},
		{
			name: 'project-three',
			tagline: 'One line about what it does and why it exists.',
			stack: ['python', 'postgres'],
			href: ''
		},
		{
			name: 'project-four',
			tagline: 'One line about what it does and why it exists.',
			stack: ['go', 'docker'],
			href: ''
		}
	];
</script>

<svelte:head>
	<title>projects — raqz.pl</title>
	<meta name="description" content="Projects by Mariusz Rakus" />
</svelte:head>

<section class="view">
	<div class="view-inner">
		<h1>projects</h1>
		<p class="lead">Things I build and maintain.</p>

		<ul class="cards">
			{#each projects as project (project.name)}
				<li class="card">
					<div class="card-head">
						<span class="name">&gt; {project.name}</span>
						{#if project.href}
							<a class="link" href={project.href} target="_blank" rel="noreferrer">open ↗</a>
						{/if}
					</div>
					<p class="tagline">{project.tagline}</p>
					<p class="stack">{project.stack.join(' · ')}</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.cards {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card {
		padding: 1rem 1.1rem;
		border: 1px solid rgba(255, 255, 255, 0.18);
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.card:hover {
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.02);
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}

	.name {
		color: #ffffff;
		font-weight: 600;
	}

	.tagline {
		margin: 0.5rem 0 0.35rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.stack {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.4);
	}
</style>
