import { DEFAULT_LANG, LANGS, PAGE_PATHS, SITE_URL, t, type Lang } from './i18n';
import { projectAnchor, projects } from './projects';

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

/** One entry per page per language, each listing all its language versions. */
export function sitemapXml(): string {
	const entries = PAGE_PATHS.flatMap((path) =>
		LANGS.map((lang) => {
			const alternates = alternateLinks(path)
				.map((link) => `<xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${link.href}"/>`)
				.join('');
			return `<url><loc>${SITE_URL}/${lang}${path}</loc>${alternates}</url>`;
		})
	);
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`;
}

/** A plain Markdown summary for AI crawlers and assistants (llmstxt.org). English only. */
export function llmsTxt(): string {
	const strings = t(DEFAULT_LANG);
	const projectLines = projects.map((project) => {
		const href = project.href ?? `${SITE_URL}/en/projects#${projectAnchor(project.name)}`;
		return `- [${project.name}](${href}): ${project.tagline.en}`;
	});
	return [
		`# ${SITE_NAME}`,
		'',
		`> ${strings.home.description}`,
		'',
		'## Pages',
		'',
		`- [Home](${SITE_URL}/en): ${strings.home.lead}`,
		`- [Projects](${SITE_URL}/en/projects): ${strings.projects.description}`,
		`- [Contact](${SITE_URL}/en/contact): ${strings.contact.description}`,
		`- Polish version: ${SITE_URL}/pl`,
		'',
		'## Projects',
		'',
		...projectLines,
		'',
		'## Profiles',
		'',
		`- [GitHub](${PROFILES.github})`,
		`- [LinkedIn](${PROFILES.linkedin})`,
		''
	].join('\n');
}
