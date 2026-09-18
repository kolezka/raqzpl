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
			name: 'tg-viewer',
			tagline:
				'Offline Telegram forensics for macOS. Decrypts SQLCipher stores and parses the Postbox format, deleted messages and secret chats included.',
			stack: ['python', 'sqlcipher', 'mtproto'],
			href: 'https://github.com/kolezka/tg-viewer'
		},
		{
			name: 'tg-spy',
			tagline:
				'Telegram crawler that maps group and channel membership and activity, with recursive link discovery.',
			stack: ['bun', 'mtcute', 'postgres', 'sveltekit'],
			href: 'https://github.com/kolezka/tg-spy'
		},
		{
			name: 'subagent-router',
			tagline: 'Provider-agnostic subagent model routing for Claude Code, OpenCode and Codex.',
			stack: ['typescript', 'node'],
			href: 'https://github.com/kolezka/subagent-router'
		},
		{
			name: 'self-improvement-loop',
			tagline:
				'Claude Code plugin that reflects on past sessions in the background and promotes recurring lessons into skills, hooks and rules.',
			stack: ['typescript', 'claude code', 'sveltekit'],
			href: 'https://github.com/kolezka/self-improvement-loop'
		},
		{
			name: 'kb',
			tagline:
				'Personal knowledge base: markdown vault, hybrid search over Weaviate and Postgres, code and concept graph, CLI and MCP server for agents.',
			stack: ['typescript', 'weaviate', 'postgres', 'mcp'],
			href: 'https://github.com/kolezka/kb'
		},
		{
			name: 'NL5H00X',
			tagline:
				'Firmware tooling for locked-down Chinese projectors: unlock, custom launcher, backup and recovery.',
			stack: ['shell', 'python', 'android'],
			href: 'https://github.com/kolezka/NL5H00X'
		},
		{
			name: 'block-docs',
			tagline:
				'Claude Code skill, writer agent and linter for evidence-based block documentation.',
			stack: ['python', 'claude code'],
			href: 'https://github.com/kolezka/block-docs'
		},
		{
			name: 'bruce-pcap-forensics',
			tagline:
				'Local-first dashboard for 802.11 captures from Bruce firmware. Everything stays on the machine.',
			stack: ['bun', 'sveltekit', 'tshark', 'sqlite'],
			href: 'https://github.com/kolezka/bruce-pcap-forensics'
		},
		{
			name: 'kolezka-cards',
			tagline: 'Dynamic SVG cards for GitHub READMEs, with per-card analytics that store no IPs.',
			stack: ['bun', 'hono', 'sveltekit'],
			href: 'https://github.com/kolezka/kolezka-cards',
			live: 'https://ghcards.raqz.link'
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
