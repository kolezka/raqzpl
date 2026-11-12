import { LANGS, type Lang } from './i18n';

// Service pages live at the addresses the old site used, which Google still shows:
// `/pl/uslugi/boty-telegram`, `/services/ai-integrations` (now `/en/services/...`).
// The main pages never link here; visitors arrive from search.

/** The services section's path segment per language. */
export const SERVICE_SECTION: Record<Lang, string> = { en: 'services', pl: 'uslugi' };

type ServiceCopy = {
	title: string;
	description: string;
	heading: string;
	lead: string;
	offer: string[];
	approach: string[];
};

export type Service = {
	id: string;
	slug: Record<Lang, string>;
	copy: Record<Lang, ServiceCopy>;
	/** Names from `projects.ts`, shown as related work. */
	projects: string[];
};

export const services: Service[] = [
	{
		id: 'telegram-bots',
		slug: { en: 'telegram-bots', pl: 'boty-telegram' },
		copy: {
			en: {
				title: 'Telegram bot development · Mariusz Rakus',
				description:
					'I build Telegram bots: commands and menus, notifications, group moderation, and links to your API, database or an AI model. Written in TypeScript.',
				heading: 'Telegram bots',
				lead: 'Bots that do real work in a chat: answer customers, send alerts, moderate groups or front an internal tool.',
				offer: [
					'Command bots with menus and inline buttons',
					'Notifications and alerts from your own systems',
					'Moderation for groups and channels',
					'Bots that answer from an AI model or your knowledge base',
					'Integrations with your API, database or CRM'
				],
				approach: [
					'TypeScript on Bun or Node, with tests',
					'Webhooks on your domain, or long polling where that is enough',
					'State in PostgreSQL or SQLite',
					'Docker deployment that moves easily between servers'
				]
			},
			pl: {
				title: 'Boty Telegram na zamówienie · Mariusz Rakus',
				description:
					'Tworzę boty Telegram: komendy i menu, powiadomienia, moderacja grup oraz integracja z Twoim API, bazą danych albo modelem AI. Kod w TypeScript.',
				heading: 'Boty Telegram',
				lead: 'Boty, które wykonują realną pracę na czacie: odpowiadają klientom, wysyłają alerty, moderują grupy albo obsługują wewnętrzne narzędzie.',
				offer: [
					'Boty z komendami, menu i przyciskami inline',
					'Powiadomienia i alerty z Twoich systemów',
					'Moderacja grup i kanałów',
					'Boty odpowiadające z modelu AI albo Twojej bazy wiedzy',
					'Integracje z API, bazą danych lub CRM'
				],
				approach: [
					'TypeScript na Bun albo Node, z testami',
					'Webhooki pod Twoją domeną albo long polling, gdy to wystarczy',
					'Stan w PostgreSQL lub SQLite',
					'Wdrożenie w Dockerze, łatwe do przeniesienia na inny serwer'
				]
			}
		},
		projects: ['tg-spy', 'tg-viewer']
	},
	{
		id: 'discord-bots',
		slug: { en: 'discord-bots', pl: 'boty-discord' },
		copy: {
			en: {
				title: 'Discord bot development · Mariusz Rakus',
				description:
					'I build Discord bots: slash commands, roles and moderation, server automation, alerts, and links to your API, database or an AI model.',
				heading: 'Discord bots',
				lead: 'Bots that help run a community server: slash commands, roles, moderation and alerts from the tools you already use.',
				offer: [
					'Slash commands, buttons and forms',
					'Role management and onboarding for new members',
					'Moderation and logs',
					'Alerts from GitHub, monitoring or your own systems',
					'Bots that answer from an AI model or your knowledge base'
				],
				approach: [
					'TypeScript with discord.js, with tests',
					'Only the permissions and intents the bot really needs',
					'State in PostgreSQL or SQLite',
					'Docker deployment that moves easily between servers'
				]
			},
			pl: {
				title: 'Boty Discord na zamówienie · Mariusz Rakus',
				description:
					'Tworzę boty Discord: komendy slash, role i moderacja, automatyzacja serwera, alerty oraz integracja z Twoim API, bazą danych albo modelem AI.',
				heading: 'Boty Discord',
				lead: 'Boty, które pomagają prowadzić serwer społeczności: komendy slash, role, moderacja i alerty z narzędzi, których już używasz.',
				offer: [
					'Komendy slash, przyciski i formularze',
					'Zarządzanie rolami i powitanie nowych osób',
					'Moderacja i logi',
					'Alerty z GitHuba, monitoringu albo Twoich systemów',
					'Boty odpowiadające z modelu AI albo Twojej bazy wiedzy'
				],
				approach: [
					'TypeScript i discord.js, z testami',
					'Tylko te uprawnienia i intenty, których bot naprawdę potrzebuje',
					'Stan w PostgreSQL lub SQLite',
					'Wdrożenie w Dockerze, łatwe do przeniesienia na inny serwer'
				]
			}
		},
		projects: []
	},
	{
		id: 'ai-integrations',
		slug: { en: 'ai-integrations', pl: 'integracje-ai' },
		copy: {
			en: {
				title: 'AI integrations and LLM development · Mariusz Rakus',
				description:
					'I connect language models to your product and data: document search with cited answers, MCP servers for coding agents, chat assistants and automations.',
				heading: 'AI integrations',
				lead: 'Language models wired into the systems you already run, answering from your own data and checked by tests.',
				offer: [
					'Search over your documents with cited answers (BM25, embeddings, hybrid ranking)',
					'MCP servers that give coding agents your tools and documentation',
					'Assistants in Telegram, Discord or your own app',
					'Automations that classify, extract and summarise incoming data',
					'Self-hosted models when data must stay on your servers'
				],
				approach: [
					'Search quality measured on real questions before and after each change',
					'Answers that cite their sources',
					'Token and cost limits per request',
					'Hosted APIs or self-hosted models, whichever fits'
				]
			},
			pl: {
				title: 'Integracje AI i modele językowe · Mariusz Rakus',
				description:
					'Łączę modele językowe z Twoim produktem i danymi: wyszukiwanie w dokumentach ze źródłami, serwery MCP, asystenci na czacie i automatyzacje.',
				heading: 'Integracje AI',
				lead: 'Modele językowe podłączone do systemów, które już masz, odpowiadające na podstawie Twoich danych i sprawdzane testami.',
				offer: [
					'Wyszukiwanie w Twoich dokumentach z odpowiedziami ze źródłami (BM25, embeddingi, ranking hybrydowy)',
					'Serwery MCP, które dają agentom programistycznym Twoje narzędzia i dokumentację',
					'Asystenci w Telegramie, Discordzie albo Twojej aplikacji',
					'Automatyzacje: klasyfikacja, wyciąganie danych i streszczenia',
					'Modele hostowane u Ciebie, gdy dane nie mogą opuścić Twoich serwerów'
				],
				approach: [
					'Jakość wyszukiwania mierzona na prawdziwych pytaniach przed zmianą i po niej',
					'Odpowiedzi podają źródła',
					'Limity tokenów i kosztów na zapytanie',
					'API w chmurze albo modele hostowane lokalnie, zależnie od potrzeb'
				]
			}
		},
		projects: ['Docify', 'kb', 'fleet-control']
	}
];

/** The service's path (or the overview's, with no service) in every language, without the language prefix. */
export function servicePaths(service?: Service): Record<Lang, string> {
	const paths = {} as Record<Lang, string>;
	for (const lang of LANGS) {
		paths[lang] = `/${SERVICE_SECTION[lang]}${service ? `/${service.slug[lang]}` : ''}`;
	}
	return paths;
}

/** The overview plus every service, for the sitemap. */
export function allServicePaths(): Record<Lang, string>[] {
	return [servicePaths(), ...services.map((service) => servicePaths(service))];
}

export type ServiceResolution = { kind: 'page'; service?: Service } | { kind: 'redirect'; location: string };

/**
 * Decides what `/<lang>/<section>/<slug>` shows. A section or slug from the other language
 * redirects to this language's address; an unknown slug is a retired service page from the
 * old site and redirects to the overview.
 */
export function resolveServicePage(lang: Lang, section: string, slug: string | undefined): ServiceResolution {
	const service = slug ? services.find((item) => LANGS.some((code) => item.slug[code] === slug)) : undefined;
	const target = `/${lang}${servicePaths(service)[lang]}`;

	if (slug && !service) return { kind: 'redirect', location: `/${lang}/${SERVICE_SECTION[lang]}` };
	if (section !== SERVICE_SECTION[lang] || (service && slug !== service.slug[lang])) {
		return { kind: 'redirect', location: target };
	}
	return service ? { kind: 'page', service } : { kind: 'page' };
}
