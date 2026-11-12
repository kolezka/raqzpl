// Two languages, one dictionary. The server picks the language per request and
// passes it down through the root layout, so SSR and the browser agree.

export const LANGS = ['en', 'pl'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** Canonical site origin, for absolute canonical and hreflang URLs. */
export const SITE_URL = 'https://raqz.pl';

/** Localized pages as language-independent paths. Drives the sitemap. */
export const PAGE_PATHS = ['', '/projects', '/contact'] as const;

/** Strips a leading `/en` or `/pl`, leaving `''` for the home page or `/projects`. */
export function pathWithoutLang(pathname: string): string {
	const segment = pathname.split('/')[1];
	if (isLang(segment)) {
		const rest = pathname.slice(segment.length + 1);
		return rest === '/' ? '' : rest;
	}
	return pathname === '/' ? '' : pathname;
}

/** Builds a localized path: `withLang('pl', '/projects')` gives `/pl/projects`. */
export function withLang(lang: Lang, rest: string): string {
	return `/${lang}${rest}`;
}

export function isLang(value: string | null | undefined): value is Lang {
	return value === 'en' || value === 'pl';
}

type Strings = {
	nav: { home: string; projects: string; contact: string; primary: string; language: string };
	home: {
		title: string;
		description: string;
		heading: string;
		lead: string;
		selectedWork: string;
		allProjects: (total: number) => string;
	};
	projects: {
		title: string;
		description: string;
		heading: string;
		lead: string;
		live: string;
		code: string;
		private: string;
		allWork: string;
		counts: (total: number, withSource: number, live: number) => string;
	};
	contact: {
		title: string;
		description: string;
		heading: string;
		lead: string;
		channels: string;
		formHeading: string;
		name: string;
		email: string;
		message: string;
		send: string;
		sending: string;
		sent: string;
		errorName: string;
		errorEmail: string;
		errorMessage: string;
		errorServer: string;
	};
};

const en: Strings = {
	nav: {
		home: 'home',
		projects: 'projects',
		contact: 'contact',
		primary: 'Primary',
		language: 'Language'
	},
	home: {
		title: 'raqz.pl — Mariusz Rakus',
		description: 'raqz.pl, raqz.dev, raqz.link, raqz.app, raqz.contact — Mariusz Rakus',
		heading: 'Things I build and maintain.',
		lead: 'I build tools for coding agents, run my own infrastructure, and take apart hardware I own.',
		selectedWork: 'selected work',
		allProjects: (total) => `all ${total} projects →`
	},
	projects: {
		title: 'projects — raqz.pl',
		description: 'Projects by Mariusz Rakus',
		heading: 'projects',
		lead: 'Things I build and maintain.',
		live: 'live',
		code: 'code',
		private: 'private',
		allWork: 'all work',
		counts: (total, withSource, live) => `${total} projects · ${withSource} with source · ${live} live`
	},
	contact: {
		title: 'contact — raqz.pl',
		description: 'Contact Mariusz Rakus',
		heading: 'contact',
		lead: 'Reach me on any of these.',
		channels: 'channels',
		formHeading: 'send a message',
		name: 'name',
		email: 'email',
		message: 'message',
		send: 'send ↵',
		sending: 'sending…',
		sent: 'Message sent. I answer from hello@raqz.pl.',
		errorName: 'Give a name, 120 characters at most.',
		errorEmail: 'Give an email address I can answer.',
		errorMessage: 'Write a message, 5000 characters at most.',
		errorServer: 'The mail server refused the message. Try again later.'
	}
};

const pl: Strings = {
	nav: {
		home: 'start',
		projects: 'projekty',
		contact: 'kontakt',
		primary: 'Główna',
		language: 'Język'
	},
	home: {
		title: 'raqz.pl — Mariusz Rakus',
		description: 'raqz.pl, raqz.dev, raqz.link, raqz.app, raqz.contact — Mariusz Rakus',
		heading: 'Rzeczy, które buduję i utrzymuję.',
		lead: 'Buduję narzędzia dla agentów programistycznych, utrzymuję własną infrastrukturę i rozbieram na części własny sprzęt.',
		selectedWork: 'wybrane projekty',
		allProjects: (total) => `wszystkie projekty (${total}) →`
	},
	projects: {
		title: 'projekty — raqz.pl',
		description: 'Projekty Mariusza Rakusa',
		heading: 'projekty',
		lead: 'Rzeczy, które buduję i utrzymuję.',
		live: 'demo',
		code: 'kod',
		private: 'prywatny',
		allWork: 'wszystkie',
		// Labels before numbers, so Polish needs no plural forms.
		counts: (total, withSource, live) => `projekty: ${total} · z kodem: ${withSource} · demo: ${live}`
	},
	contact: {
		title: 'kontakt — raqz.pl',
		description: 'Kontakt do Mariusza Rakusa',
		heading: 'kontakt',
		lead: 'Napisz na dowolnym z tych kanałów.',
		channels: 'kanały',
		formHeading: 'wyślij wiadomość',
		name: 'imię',
		email: 'email',
		message: 'wiadomość',
		send: 'wyślij ↵',
		sending: 'wysyłanie…',
		sent: 'Wiadomość wysłana. Odpowiadam z hello@raqz.pl.',
		errorName: 'Podaj imię, maksymalnie 120 znaków.',
		errorEmail: 'Podaj adres email, na który mogę odpowiedzieć.',
		errorMessage: 'Napisz wiadomość, maksymalnie 5000 znaków.',
		errorServer: 'Serwer pocztowy odrzucił wiadomość. Spróbuj ponownie później.'
	}
};

const dictionaries: Record<Lang, Strings> = { en, pl };

export function t(lang: Lang): Strings {
	return dictionaries[lang];
}
