<script lang="ts">
	import { page } from '$app/state';
	import { t, type Lang } from '$lib/i18n';

	type Project = {
		name: string;
		tagline: Record<Lang, string>;
		stack: string[];
		href?: string;
		live?: string;
	};

	const strings = $derived(t(page.data.lang));

	// Curated projects. Only public repositories get a source link.
	const projects: Project[] = [
		{
			name: 'Docify',
			tagline: {
				en: 'Version-aware documentation search for AI coding agents, serving cited, token-bounded excerpts over MCP instead of entire documentation pages.',
				pl: 'Wyszukiwanie dokumentacji dla agentów AI z uwzględnieniem wersji bibliotek. Zwraca przez MCP fragmenty ze źródłami i limitem tokenów zamiast całych stron.'
			},
			stack: ['typescript', 'svelte', 'mcp']
		},
		{
			name: 'fleet-control',
			tagline: {
				en: 'Web control panel, API and MCP service for agent-fleet: live read-only terminals, model visibility, approval requests and command tracking backed by SQLite.',
				pl: 'Panel webowy, API i serwer MCP dla agent-fleet: podgląd terminali na żywo, informacje o modelach, zatwierdzanie próśb i śledzenie poleceń ze stanem w SQLite.'
			},
			stack: ['typescript', 'bun', 'sqlite', 'mcp']
		},
		{
			name: 'agent-fleet',
			tagline: {
				en: 'Supervision for autonomous Claude Code agents in tmux, with a watchdog, supervisor handoffs and advisors for long-running work.',
				pl: 'Nadzór nad autonomicznymi agentami Claude Code w tmux: watchdog, przekazywanie nadzoru i agenci doradczy przy długotrwałych zadaniach.'
			},
			stack: ['shell', 'tmux', 'claude code']
		},
		{
			name: 'RentHunter',
			tagline: {
				en: 'Self-hosted rental search for Poland’s Tricity: collects listings from OLX, Otodom and trojmiasto.pl, scores them with AI and sends notifications.',
				pl: 'Samodzielnie hostowana wyszukiwarka wynajmu w Trójmieście: zbiera ogłoszenia z OLX, Otodom i trojmiasto.pl, ocenia je przez AI i wysyła powiadomienia.'
			},
			stack: ['bun', 'svelte', 'postgres', 'drizzle', 'deepseek'],
			href: 'https://github.com/kolezka/renthunter'
		},
		{
			name: 'claude-stealth-search-plugin',
			tagline: {
				en: 'Claude Code web search and page reading through self-hosted SearXNG and Crawl4AI, without hosted search APIs.',
				pl: 'Wyszukiwanie w sieci i odczyt stron w Claude Code przez samodzielnie hostowane SearXNG i Crawl4AI, bez zewnętrznych API wyszukiwania.'
			},
			stack: ['typescript', 'claude code', 'searxng', 'crawl4ai'],
			href: 'https://github.com/kolezka/claude-stealth-search-plugin'
		},
		{
			name: 'design-studio',
			tagline: {
				en: 'Design and redesign interfaces as HTML drafts compared on a local canvas, without an external design service.',
				pl: 'Projektowanie i przeprojektowywanie interfejsów jako szkiców HTML porównywanych na lokalnym płótnie, bez zewnętrznej usługi projektowej.'
			},
			stack: ['typescript', 'html', 'claude code'],
			href: 'https://github.com/kolezka/design-studio'
		},
		{
			name: 'claude-plugins-dsh',
			tagline: {
				en: 'Compatibility runtime for running unmodified Claude Code plugins inside DeepSeek Harness.',
				pl: 'Warstwa zgodności pozwalająca uruchamiać niezmodyfikowane wtyczki Claude Code w DeepSeek Harness.'
			},
			stack: ['typescript', 'javascript', 'dsh'],
			href: 'https://github.com/kolezka/claude-plugins-dsh'
		},
		{
			name: 'CALM',
			tagline: {
				en: 'Proof-of-concept infinite canvas for macOS: arrange live Ghostty terminals, browser panels and plugins like a whiteboard.',
				pl: 'Prototyp nieskończonego płótna dla macOS: układaj terminale Ghostty, panele przeglądarki i wtyczki jak na tablicy.'
			},
			stack: ['rust', 'macos', 'ghostty'],
			href: 'https://github.com/kolezka/CALM'
		},
		{
			name: 'claude-performance-analyzer',
			tagline: {
				en: 'macOS menu-bar widget and local dashboard for Claude Code performance, from model latency to hooks, tools and MCP startup.',
				pl: 'Widżet na pasku menu macOS i lokalny panel wydajności Claude Code: opóźnienia modeli, hooki, narzędzia i start serwerów MCP.'
			},
			stack: ['typescript', 'swift', 'svelte', 'opentelemetry'],
			href: 'https://github.com/kolezka/claude-performance-analyzer'
		},
		{
			name: 'worklog-persist',
			tagline: {
				en: 'Durable work-state for coding agents in Outline: task context, verified checkpoints, handoffs and completion records across sessions.',
				pl: 'Trwały stan pracy agentów programistycznych w Outline: kontekst zadań, zweryfikowane punkty kontrolne, przekazanie pracy i wyniki między sesjami.'
			},
			stack: ['typescript', 'shell', 'claude code', 'outline'],
			href: 'https://github.com/kolezka/worklog-persist'
		},
		{
			name: 'tg-viewer',
			tagline: {
				en: 'Offline Telegram forensics for macOS. Decrypts SQLCipher stores and parses the Postbox format, deleted messages and secret chats included.',
				pl: 'Forensyka Telegrama offline dla macOS. Odszyfrowuje bazy SQLCipher i czyta format Postbox, razem z usuniętymi wiadomościami i tajnymi czatami.'
			},
			stack: ['python', 'sqlcipher', 'mtproto'],
			href: 'https://github.com/kolezka/tg-viewer'
		},
		{
			name: 'tg-spy',
			tagline: {
				en: 'Telegram crawler that maps group and channel membership and activity, with recursive link discovery.',
				pl: 'Crawler Telegrama, który mapuje członkostwo i aktywność w grupach oraz kanałach, z rekurencyjnym wykrywaniem linków.'
			},
			stack: ['bun', 'mtcute', 'postgres', 'sveltekit']
		},
		{
			name: 'subagent-router',
			tagline: {
				en: 'Provider-agnostic subagent model routing for Claude Code, OpenCode and Codex.',
				pl: 'Routing modeli dla subagentów, niezależny od dostawcy: Claude Code, OpenCode i Codex.'
			},
			stack: ['typescript', 'node'],
			href: 'https://github.com/kolezka/subagent-router'
		},
		{
			name: 'self-improvement-loop',
			tagline: {
				en: 'Claude Code plugin that reflects on past sessions in the background and promotes recurring lessons into skills, hooks and rules.',
				pl: 'Wtyczka do Claude Code, która w tle analizuje poprzednie sesje i zamienia powtarzające się wnioski w skille, hooki i reguły.'
			},
			stack: ['typescript', 'claude code', 'sveltekit'],
			href: 'https://github.com/kolezka/self-improvement-loop'
		},
		{
			name: 'kb',
			tagline: {
				en: 'Personal knowledge base: markdown vault, hybrid search over Weaviate and Postgres, code and concept graph, CLI and MCP server for agents.',
				pl: 'Osobista baza wiedzy: repozytorium markdown, wyszukiwanie hybrydowe na Weaviate i Postgresie, graf kodu i pojęć, CLI oraz serwer MCP dla agentów.'
			},
			stack: ['typescript', 'weaviate', 'postgres', 'mcp']
		},
		{
			name: 'NL5H00X',
			tagline: {
				en: 'Firmware tooling for locked-down Chinese projectors: unlock, custom launcher, backup and recovery.',
				pl: 'Narzędzia do firmware zamkniętych chińskich projektorów: odblokowanie, własny launcher, kopia zapasowa i odzyskiwanie.'
			},
			stack: ['shell', 'python', 'android'],
			href: 'https://github.com/kolezka/NL5H00X'
		},
		{
			name: 'block-docs',
			tagline: {
				en: 'Claude Code skill, writer agent and linter for evidence-based block documentation.',
				pl: 'Skill do Claude Code, agent piszący i linter do dokumentacji blokowej opartej na dowodach.'
			},
			stack: ['python', 'claude code'],
			href: 'https://github.com/kolezka/block-docs'
		},
		{
			name: 'bruce-pcap-forensics',
			tagline: {
				en: 'Local-first dashboard for 802.11 captures from Bruce firmware. Everything stays on the machine.',
				pl: 'Panel do analizy zrzutów 802.11 z firmware Bruce, działa lokalnie. Wszystko zostaje na komputerze.'
			},
			stack: ['bun', 'sveltekit', 'tshark', 'sqlite'],
			href: 'https://github.com/kolezka/bruce-pcap-forensics'
		},
		{
			name: 'kolezka-cards',
			tagline: {
				en: 'Dynamic SVG cards for GitHub READMEs, with per-card analytics that store no IPs.',
				pl: 'Dynamiczne karty SVG do README na GitHubie, z analityką per karta, która nie zapisuje adresów IP.'
			},
			stack: ['bun', 'hono', 'sveltekit'],
			href: 'https://github.com/kolezka/kolezka-cards',
			live: 'https://ghcards.raqz.link'
		}
	];
</script>

<svelte:head>
	<title>{strings.projects.title}</title>
	<meta name="description" content={strings.projects.description} />
</svelte:head>

<section class="view">
	<div class="view-inner">
		<h1>{strings.projects.heading}</h1>
		<p class="lead">{strings.projects.lead}</p>

		<ul class="cards">
			{#each projects as project (project.name)}
				<li class="card">
					<div class="card-head">
						<span class="name">&gt; {project.name}</span>
						<span class="links">
							{#if project.live}
								<a class="link" href={project.live} target="_blank" rel="noreferrer"
									>{strings.projects.live} ↗</a
								>
							{/if}
							{#if project.href}
								<a class="link" href={project.href} target="_blank" rel="noreferrer"
									>{strings.projects.code} ↗</a
								>
							{/if}
						</span>
					</div>
					<p class="tagline">{project.tagline[page.data.lang]}</p>
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
