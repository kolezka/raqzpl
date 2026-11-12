import { DEFAULT_LANG, LANGS, SITE_URL, type Lang } from './i18n';

export const SITE_NAME = 'raqz.pl';
export const AUTHOR_NAME = 'Mariusz Rakus';

/** Public profiles, shared by the contact page and the structured data. */
export const PROFILES = {
	github: 'https://github.com/kolezka',
	linkedin: 'https://www.linkedin.com/in/mariusz-rakus/'
} as const;

export type AlternateLink = { hreflang: Lang | 'x-default'; href: string };

/** Every language version of one page, plus `x-default`, as absolute URLs. */
export function alternateLinks(rest: string): AlternateLink[] {
	return [
		...LANGS.map((code) => ({ hreflang: code, href: `${SITE_URL}/${code}${rest}` })),
		{ hreflang: 'x-default', href: `${SITE_URL}/${DEFAULT_LANG}${rest}` }
	];
}

const OG_LOCALES: Record<Lang, string> = { en: 'en_US', pl: 'pl_PL' };

export function ogLocale(lang: Lang): string {
	return OG_LOCALES[lang];
}

/** schema.org data for the home page: the site and the person behind it. */
export function siteJsonLd(lang: Lang): Record<string, unknown> {
	const personId = `${SITE_URL}/#person`;
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Person',
				'@id': personId,
				name: AUTHOR_NAME,
				url: SITE_URL,
				sameAs: [PROFILES.github, PROFILES.linkedin]
			},
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				name: SITE_NAME,
				url: `${SITE_URL}/${lang}`,
				inLanguage: lang,
				publisher: { '@id': personId }
			}
		]
	};
}

/** A JSON-LD script tag. `<` is escaped so no string inside can close the tag. */
export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
