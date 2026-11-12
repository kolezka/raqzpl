import type { Lang } from '$lib/i18n';

export type Project = {
	name: string;
	tagline: Record<Lang, string>;
	stack: string[];
	/** Source code. Missing for private repositories. */
	href?: string;
	/** Running demo. */
	live?: string;
};

// Curated projects. Only public repositories get a source link.
export const projects: Project[] = [
	{
		name: 'Docify',
		tagline: {
			en: 'Local-first documentation retrieval for coding agents, combining SQLite FTS5/BM25, exact API-symbol matching and vector embeddings through rank fusion, with optional graph expansion. Version-pinned sources, atomically activated indexes and cited, token-budgeted MCP responses keep retrieval tied to the right library release.',
			pl: 'Lokalny silnik wyszukiwania dokumentacji dla agentów programistycznych. Łączy SQLite FTS5/BM25, dopasowanie symboli API i embeddingi wektorowe przez fuzję rankingów, z opcjonalnym rozszerzaniem wyników grafem. Przypięte wersje źródeł, atomowa aktywacja indeksów i odpowiedzi MCP z cytowaniami oraz budżetem tokenów wiążą wyniki z właściwym wydaniem biblioteki.'
		},
		stack: ['typescript', 'svelte', 'mcp']
	},
	{
		name: 'fleet-control',
		tagline: {
			en: 'A web, API and MCP control plane for agent-fleet, separating supervision from agent execution. SQLite persists commands, requests and approvals; revision-scoped decisions, read-only terminal streams and a multi-host gateway make distributed agent work inspectable from one interface.',
			pl: 'Warstwa sterowania agent-fleet przez panel webowy, API i MCP, oddzielająca nadzór od wykonywania zadań. SQLite przechowuje polecenia, zgłoszenia i zgody, a decyzje powiązane z rewizją, strumienie terminali tylko do odczytu i brama do wielu hostów pozwalają kontrolować rozproszoną pracę agentów z jednego miejsca.'
		},
		stack: ['typescript', 'bun', 'sqlite', 'mcp']
	},
	{
		name: 'agent-fleet',
		tagline: {
			en: 'Orchestration of autonomous Claude Code workers across local and remote tmux hosts. A watchdog detects idle or stalled agents, restores missing sessions and rotates workers at context limits; supervisor handoffs preserve continuity while earlier supervisors remain available as advisors.',
			pl: 'Orkiestracja autonomicznych agentów Claude Code w tmux na lokalnych i zdalnych hostach. Watchdog wykrywa bezczynność i zastoje, odtwarza brakujące sesje oraz rotuje agentów przy limitach kontekstu. Przekazywanie nadzoru zachowuje ciągłość pracy, a poprzedni nadzorcy pozostają dostępni jako doradcy.'
		},
		stack: ['shell', 'tmux', 'claude code']
	},
	{
		name: 'RentHunter',
		tagline: {
			en: 'A self-hosted rental intelligence pipeline with source adapters, bounded-concurrency enrichment and PostgreSQL change snapshots. Optional embedding-based similarity search and LLM scoring rank listings against personal criteria; a virtualized Svelte interface, resumable SSE logs and notifications expose the full collection-to-decision workflow.',
			pl: 'Samodzielnie hostowany system analizy ofert najmu: adaptery portali, wzbogacanie danych z ograniczoną współbieżnością i historia zmian w PostgreSQL. Opcjonalne wyszukiwanie przez podobieństwo embeddingów oraz ocena LLM dopasowują oferty do kryteriów użytkownika. Wirtualizowany interfejs Svelte, wznawialne logi SSE i powiadomienia obejmują cały proces od zebrania oferty do decyzji.'
		},
		stack: ['bun', 'svelte', 'postgres', 'drizzle', 'deepseek'],
		href: 'https://github.com/kolezka/renthunter'
	},
	{
		name: 'claude-stealth-search-plugin',
		tagline: {
			en: 'A self-hosted web-research integration for Claude Code and DeepSeek Harness, routing discovery through SearXNG and rendered-page extraction through Crawl4AI. Bounded same-section crawls, explicit service failures and hooks blocking built-in web tools keep the research path predictable without silent provider fallback.',
			pl: 'Integracja wyszukiwania internetowego dla Claude Code i DeepSeek Harness oparta na własnych instancjach SearXNG i Crawl4AI. Łączy wyszukiwanie źródeł z ekstrakcją renderowanych stron, ogranicza crawling do wybranej sekcji i jawnie zgłasza awarie. Hooki blokują wbudowane narzędzia webowe, bez cichego przełączania na innego dostawcę.'
		},
		stack: ['typescript', 'claude code', 'searxng', 'crawl4ai'],
		href: 'https://github.com/kolezka/claude-stealth-search-plugin'
	},
	{
		name: 'design-studio',
		tagline: {
			en: 'A code-informed UI design workflow that reconstructs the existing screen before exploring structurally distinct HTML variants. A local comparison canvas supports responsive viewports, light/dark rendering and versioned iterations, with screenshot review before implementation and no product-code changes during exploration.',
			pl: 'Proces projektowania UI oparty na istniejącym kodzie: najpierw odtworzenie obecnego ekranu, potem warianty HTML różniące się strukturą. Lokalne płótno porównawcze obsługuje widoki responsywne, tryby jasny i ciemny oraz wersjonowane iteracje. Przegląd renderów poprzedza implementację, a etap eksploracji nie zmienia kodu produktu.'
		},
		stack: ['typescript', 'html', 'claude code'],
		href: 'https://github.com/kolezka/design-studio'
	},
	{
		name: 'claude-plugins-dsh',
		tagline: {
			en: 'A compatibility runtime mapping Claude Code plugin skills, commands, agents and lifecycle hooks onto DeepSeek Harness. It translates hook events and blocking decisions, isolates hook processes and supplies inspection/scaffolding tools so plugin authors can share one source tree across both harnesses.',
			pl: 'Runtime zgodności mapujący skille, komendy, agentów i hooki wtyczek Claude Code na DeepSeek Harness. Tłumaczy zdarzenia i decyzje blokujące, izoluje procesy hooków oraz dostarcza narzędzia inspekcji i generowania adapterów. Pozwala utrzymywać wspólne źródła wtyczki dla obu środowisk.'
		},
		stack: ['typescript', 'javascript', 'dsh'],
		href: 'https://github.com/kolezka/claude-plugins-dsh'
	},
	{
		name: 'CALM',
		tagline: {
			en: 'An early macOS workspace prototype built around an infinite canvas of live Ghostty terminals, browser surfaces and plugins. View zoom is decoupled from terminal geometry, distant panels use periodically refreshed previews, and a typed plugin SDK exposes host capabilities for custom tools and TUI panels.',
			pl: 'Wczesny prototyp środowiska pracy dla macOS z nieskończonym płótnem terminali Ghostty, przeglądarek i wtyczek. Skalowanie widoku jest oddzielone od geometrii terminali, a odległe panele korzystają z okresowo odświeżanych podglądów. Typowany SDK udostępnia funkcje hosta własnym narzędziom i panelom TUI.'
		},
		stack: ['rust', 'macos', 'ghostty'],
		href: 'https://github.com/kolezka/CALM'
	},
	{
		name: 'claude-performance-analyzer',
		tagline: {
			en: 'Local observability for Claude Code, collecting OTLP telemetry into SQLite and exposing model, tool and hook latency through a Svelte dashboard and native macOS menu-bar app. Percentiles, turn waterfalls, multi-host telemetry and read-only MCP diagnostics separate inference time from orchestration overhead.',
			pl: 'Lokalna obserwowalność Claude Code: telemetria OTLP trafia do SQLite, a panel Svelte i natywna aplikacja paska menu macOS pokazują opóźnienia modeli, narzędzi i hooków. Percentyle, osie czasu tur, dane z wielu hostów i diagnostyka MCP tylko do odczytu pozwalają oddzielić czas inferencji od narzutu orkiestracji.'
		},
		stack: ['typescript', 'swift', 'svelte', 'opentelemetry'],
		href: 'https://github.com/kolezka/claude-performance-analyzer'
	},
	{
		name: 'worklog-persist',
		tagline: {
			en: 'A durable work-state protocol for coding agents backed by Outline MCP. Stable project/task keys make checkpoints idempotent; lifecycle hooks restore context across sessions, while redaction and explicit write confirmation keep decisions, verification evidence and handoffs separate from unverified claims.',
			pl: 'Protokół trwałego stanu pracy agentów oparty na Outline MCP. Stabilne klucze projektu i zadania zapewniają idempotentne punkty kontrolne, a hooki cyklu życia odtwarzają kontekst między sesjami. Redakcja sekretów i potwierdzanie zapisu porządkują decyzje, wyniki weryfikacji oraz przekazanie pracy bez traktowania deklaracji jako dowodów.'
		},
		stack: ['typescript', 'shell', 'claude code', 'outline'],
		href: 'https://github.com/kolezka/worklog-persist'
	},
	{
		name: 'tg-viewer',
		tagline: {
			en: 'An offline Telegram data-analysis pipeline for macOS, combining SQLCipher decryption with a parser for the binary Postbox store. Extracted records are normalized to JSON and served through FastAPI and a browser interface, including recoverable deleted-message and secret-chat data present in the local store.',
			pl: 'Pipeline analizy danych Telegrama offline dla macOS, łączący odszyfrowanie SQLCipher z parserem binarnego formatu Postbox. Wyodrębnione rekordy są normalizowane do JSON i udostępniane przez FastAPI oraz interfejs przeglądarkowy, także dla zachowanych lokalnie danych usuniętych wiadomości i tajnych czatów.'
		},
		stack: ['python', 'sqlcipher', 'mtproto'],
		href: 'https://github.com/kolezka/tg-viewer'
	},
	{
		name: 'tg-spy',
		tagline: {
			en: 'A distributed Telegram collection and relationship-analysis system built on a PostgreSQL crawl frontier and pg-boss workers. Recursive discovery, live watchers and account-scoped leases coordinate ingestion; remote workers connect through an HTTPS gateway rather than direct database access, with optional pgvector-backed AI retrieval.',
			pl: 'Rozproszony system zbierania danych i analizy relacji Telegrama z kolejką odkrywania w PostgreSQL oraz workerami pg-boss. Rekurencyjne wykrywanie źródeł, obserwacja na żywo i dzierżawy przypisane do kont koordynują pobieranie danych. Zdalne workery korzystają z bramy HTTPS zamiast bezpośredniego dostępu do bazy, z opcjonalnym wyszukiwaniem AI na pgvector.'
		},
		stack: ['bun', 'mtcute', 'postgres', 'sveltekit']
	},
	{
		name: 'subagent-router',
		tagline: {
			en: 'Explicit model routing for native Claude Code subagents while the parent session retains its own model. A local proxy resolves routing markers against a synchronized gateway model catalog; generated launcher bundles and a web console manage configuration without embedding provider credentials in generated files.',
			pl: 'Jawny routing modeli dla natywnych subagentów Claude Code, przy zachowaniu modelu sesji nadrzędnej. Lokalne proxy interpretuje znaczniki routingu względem synchronizowanego katalogu modeli bramy. Generowane launchery i panel webowy zarządzają konfiguracją bez zapisywania poświadczeń dostawcy w wygenerowanych plikach.'
		},
		stack: ['typescript', 'node'],
		href: 'https://github.com/kolezka/subagent-router'
	},
	{
		name: 'self-improvement-loop',
		tagline: {
			en: 'A human-reviewed feedback pipeline for coding agents: lightweight hooks capture events, background workers analyze transcripts and recurring lessons become proposed skills, rules, hooks or agents. Changes are staged on Git branches, acceptance is tied to the reviewed diff, and usage feedback supports later refinement or retirement.',
			pl: 'Proces doskonalenia agentów z kontrolą człowieka: lekkie hooki zapisują zdarzenia, workery w tle analizują transkrypty, a powtarzające się wnioski stają się propozycjami skilli, reguł, hooków lub agentów. Zmiany trafiają na gałęzie Git, akceptacja dotyczy konkretnego diffu, a dane o użyciu pomagają je później poprawiać lub wycofywać.'
		},
		stack: ['typescript', 'claude code', 'sveltekit'],
		href: 'https://github.com/kolezka/self-improvement-loop'
	},
	{
		name: 'kb',
		tagline: {
			en: 'A personal knowledge platform connecting a Markdown vault with hybrid retrieval over Weaviate and PostgreSQL. Code and concept graphs complement document search, while CLI and MCP interfaces expose the same knowledge layer to interactive workflows and coding agents.',
			pl: 'Osobista platforma wiedzy łącząca repozytorium Markdown z wyszukiwaniem hybrydowym na Weaviate i PostgreSQL. Grafy kodu i pojęć uzupełniają wyszukiwanie dokumentów, a interfejsy CLI i MCP udostępniają tę samą warstwę wiedzy użytkownikowi oraz agentom programistycznym.'
		},
		stack: ['typescript', 'weaviate', 'postgres', 'mcp']
	},
	{
		name: 'NL5H00X',
		tagline: {
			en: 'A firmware reverse-engineering toolkit for the NL5H00X Android projector, covering vendor launcher behavior, installation restrictions and recovery diagnostics. Launcher changes require a verified backup and hash-checked cache preservation; a fake-device test harness exercises host-side logic without risking the physical unit.',
			pl: 'Zestaw narzędzi do inżynierii wstecznej firmware projektora NL5H00X z Androidem: zachowanie launchera producenta, ograniczenia instalacji i diagnostyka odzyskiwania. Zmiana launchera wymaga zweryfikowanej kopii danych i zachowania cache z kontrolą sum. Testy na symulowanym urządzeniu sprawdzają logikę narzędzi bez ryzykowania sprzętu.'
		},
		stack: ['shell', 'python', 'android'],
		href: 'https://github.com/kolezka/NL5H00X'
	},
	{
		name: 'block-docs',
		tagline: {
			en: 'A source-pinned documentation workflow that makes contracts, invariants, ownership and known gaps explicit. Separate writer and verifier agents check claims against code revisions, while a structural linter enforces document shape and evidence fields, distinguishing documented intent from actual enforcement.',
			pl: 'Proces dokumentowania powiązany z rewizjami źródeł, który jawnie opisuje kontrakty, niezmienniki, odpowiedzialności i znane luki. Oddzielni agenci piszący i weryfikujący sprawdzają twierdzenia względem kodu. Linter strukturalny pilnuje formatu i pól dowodowych, rozróżniając opisaną intencję od faktycznie egzekwowanych reguł.'
		},
		stack: ['python', 'claude code'],
		href: 'https://github.com/kolezka/block-docs'
	},
	{
		name: 'bruce-pcap-forensics',
		tagline: {
			en: 'A local-first 802.11 forensic pipeline streaming tshark output into SQLite for cross-capture network and device analysis. Event detectors identify deauthentication bursts, handshake sequences and probe anomalies; a correlated packet timeline preserves capture-specific limits such as missing radiotap data and relative timestamps.',
			pl: 'Lokalny pipeline analizy śledczej 802.11, strumieniujący wynik tshark do SQLite i łączący analizę sieci oraz urządzeń z wielu zrzutów. Detektory rozpoznają serie deautoryzacji, sekwencje handshake i anomalie sondowania. Skorelowana oś pakietów uwzględnia ograniczenia zrzutów, takie jak brak radiotap i względne znaczniki czasu.'
		},
		stack: ['bun', 'sveltekit', 'tshark', 'sqlite'],
		href: 'https://github.com/kolezka/bruce-pcap-forensics'
	},
	{
		name: 'kolezka-cards',
		tagline: {
			en: 'A self-hosted SVG rendering and analytics service for GitHub READMEs, with GitHub OAuth, configurable card renderers and PostgreSQL aggregation. Daily salted fingerprints and per-card deduplication support cookie-free visit metrics without persisting raw IP addresses or creating cross-day visitor identifiers.',
			pl: 'Samodzielnie hostowana usługa renderowania SVG i analityki dla README GitHuba, z OAuth, konfigurowalnymi rendererami kart i agregacją w PostgreSQL. Dzienne solone identyfikatory oraz deduplikacja na poziomie karty pozwalają liczyć wizyty bez cookies, zapisywania surowych adresów IP i identyfikatorów śledzących między dniami.'
		},
		stack: ['bun', 'hono', 'sveltekit'],
		href: 'https://github.com/kolezka/kolezka-cards',
		live: 'https://ghcards.raqz.link'
	}
];

/** Home shows the head of the curated list, which is ordered by hand. */
export const FEATURED_COUNT = 5;

export const featuredProjects = projects.slice(0, FEATURED_COUNT);

export const projectCounts = {
	total: projects.length,
	withSource: projects.filter((project) => project.href).length,
	live: projects.filter((project) => project.live).length
};

/** Stable anchor for a project on the projects page. */
export function projectAnchor(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
