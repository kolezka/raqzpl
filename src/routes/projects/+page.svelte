<script lang="ts">
	type Project = {
		name: string;
		tagline: string;
		stack: string[];
		href: string;
		live?: string;
	};

	// Public repos from github.com/kolezka, hand-picked. Keep this list short.
	const projects: Project[] = [
		{
			name: 'NL5H00X',
			tagline: 'Firmware tooling for locked-down Chinese projectors: unlock, custom launcher, backup and recovery.',
			stack: ['shell', 'python', 'android'],
			href: 'https://github.com/kolezka/NL5H00X'
		},
		{
			name: 'tg-viewer',
			tagline: 'Offline Telegram forensics for macOS. Decrypts SQLCipher stores and parses the Postbox format, deleted messages and secret chats included.',
			stack: ['python', 'sqlcipher', 'mtproto'],
			href: 'https://github.com/kolezka/tg-viewer'
		},
		{
			name: 'renthunter',
			tagline: 'Self-hosted rental crawler for Trójmiasto. Scrapes OLX, Otodom and trojmiasto.pl, scores listings with an LLM, pushes alerts.',
			stack: ['bun', 'svelte 5', 'postgres', 'drizzle'],
			href: 'https://github.com/kolezka/renthunter'
		},
		{
			name: 'kolezka-cards',
			tagline: 'Dynamic SVG cards for GitHub READMEs, with per-card analytics that store no IPs.',
			stack: ['bun', 'hono', 'sveltekit'],
			href: 'https://github.com/kolezka/kolezka-cards',
			live: 'https://ghcards.raqz.link'
		},
		{
			name: 'bruce-pcap-forensics',
			tagline: 'Local-first dashboard for 802.11 captures from Bruce firmware. Everything stays on the machine.',
			stack: ['bun', 'sveltekit', 'tshark', 'sqlite'],
			href: 'https://github.com/kolezka/bruce-pcap-forensics'
		},
		{
			name: 'subagent-router',
			tagline: 'Provider-agnostic subagent model routing for Claude Code, OpenCode and Codex.',
			stack: ['typescript', 'node'],
			href: 'https://github.com/kolezka/subagent-router'
		},
		{
			name: 'claude-code-routing-benchmark',
			tagline: 'Same task, same commit, same prompt, different model behind the API. Publishes one self-contained HTML report.',
			stack: ['typescript', 'claude code'],
			href: 'https://github.com/kolezka/claude-code-routing-benchmark'
		},
		{
			name: 'search-builder',
			tagline: 'Boolean query builder for Google, GitHub Code Search and Shodan.',
			stack: ['sveltekit', 'typescript'],
			href: 'https://github.com/kolezka/search-builder'
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
						<span class="links">
							{#if project.live}
								<a class="link" href={project.live} target="_blank" rel="noreferrer">live ↗</a>
							{/if}
							<a class="link" href={project.href} target="_blank" rel="noreferrer">code ↗</a>
						</span>
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

	.links {
		display: flex;
		flex-shrink: 0;
		gap: 0.9rem;
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
