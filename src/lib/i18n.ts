// Two languages, one dictionary. The server picks the language per request and
// passes it down through the root layout, so SSR and the browser agree.

export const LANGS = ['en', 'pl'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** Cookie that holds the choice. Readable by the browser, it carries no secret. */
export const LANG_COOKIE = 'lang';

/** Query parameter that switches the language, then is dropped by a redirect. */
export const LANG_PARAM = 'lang';

export function isLang(value: string | null | undefined): value is Lang {
	return value === 'en' || value === 'pl';
}

/**
 * First the cookie, then `Accept-Language`, then English. Quality values are
 * ignored: the header lists the preferred languages first, which is enough for
 * a choice between two.
 */
export function pickLang(cookie: string | undefined, acceptLanguage: string | null): Lang {
	if (isLang(cookie)) return cookie;

	for (const part of acceptLanguage?.split(',') ?? []) {
		const base = part.split(';')[0].trim().slice(0, 2).toLowerCase();
		if (isLang(base)) return base;
	}

	return DEFAULT_LANG;
}

type Strings = {
	nav: { home: string; projects: string; contact: string; primary: string; language: string };
	home: { title: string; description: string };
	projects: { title: string; description: string; heading: string; lead: string; live: string; code: string };
	contact: {
		title: string;
		description: string;
		heading: string;
		lead: string;
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
		description: 'raqz.pl, raqz.dev, raqz.link, raqz.app, raqz.contact — Mariusz Rakus'
	},
	projects: {
		title: 'projects — raqz.pl',
		description: 'Projects by Mariusz Rakus',
		heading: 'projects',
		lead: 'Things I build and maintain.',
		live: 'live',
		code: 'code'
	},
	contact: {
		title: 'contact — raqz.pl',
		description: 'Contact Mariusz Rakus',
		heading: 'contact',
		lead: 'Reach me on any of these.',
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
		description: 'raqz.pl, raqz.dev, raqz.link, raqz.app, raqz.contact — Mariusz Rakus'
	},
	projects: {
		title: 'projekty — raqz.pl',
		description: 'Projekty Mariusza Rakusa',
		heading: 'projekty',
		lead: 'Rzeczy, które buduję i utrzymuję.',
		live: 'demo',
		code: 'kod'
	},
	contact: {
		title: 'kontakt — raqz.pl',
		description: 'Kontakt do Mariusza Rakusa',
		heading: 'kontakt',
		lead: 'Napisz na dowolnym z tych kanałów.',
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
