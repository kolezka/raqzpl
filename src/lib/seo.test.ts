import { describe, expect, it } from 'vitest';
import { alternateLinks, jsonLdScript, ogLocale, siteJsonLd } from './seo';
import { LANGS, PAGE_PATHS, t } from './i18n';

describe('alternateLinks', () => {
	it('lists every language plus x-default with absolute URLs', () => {
		expect(alternateLinks('/projects')).toEqual([
			{ hreflang: 'en', href: 'https://raqz.pl/en/projects' },
			{ hreflang: 'pl', href: 'https://raqz.pl/pl/projects' },
			{ hreflang: 'x-default', href: 'https://raqz.pl/en/projects' }
		]);
	});

	it('uses the bare language path for the home page', () => {
		expect(alternateLinks('').map((link) => link.href)).toEqual([
			'https://raqz.pl/en',
			'https://raqz.pl/pl',
			'https://raqz.pl/en'
		]);
	});
});

describe('ogLocale', () => {
	it('maps each language to an Open Graph locale', () => {
		expect(ogLocale('en')).toBe('en_US');
		expect(ogLocale('pl')).toBe('pl_PL');
	});
});

describe('siteJsonLd', () => {
	it('describes the site and its owner with profile links', () => {
		const data = siteJsonLd('pl');
		const graph = data['@graph'] as Record<string, unknown>[];
		const site = graph.find((node) => node['@type'] === 'WebSite');
		const person = graph.find((node) => node['@type'] === 'Person');

		expect(data['@context']).toBe('https://schema.org');
		expect(site).toMatchObject({ url: 'https://raqz.pl/pl', inLanguage: 'pl' });
		expect(person).toMatchObject({ name: 'Mariusz Rakus', url: 'https://raqz.pl' });
		expect(person?.sameAs).toEqual(
			expect.arrayContaining(['https://github.com/kolezka'])
		);
		expect(site?.publisher).toEqual({ '@id': person?.['@id'] });
	});
});

describe('jsonLdScript', () => {
	// The JSON goes inside a <script> tag, so a `</script>` in any string must not end it.
	it('cannot close its own script tag', () => {
		const html = jsonLdScript({ name: '</script><script>alert(1)</script>' });

		expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
		expect(html.match(/<\/script>/g)).toHaveLength(1);
		expect(JSON.parse(html.slice(html.indexOf('>') + 1, html.lastIndexOf('<')))).toEqual({
			name: '</script><script>alert(1)</script>'
		});
	});
});

describe('page metadata', () => {
	// Search results cut titles near 60 characters and descriptions near 160.
	it('keeps every title and description inside the length search results show', () => {
		for (const lang of LANGS) {
			const strings = t(lang);
			for (const page of [strings.home, strings.projects, strings.contact]) {
				expect(page.title.length, page.title).toBeLessThanOrEqual(65);
				expect(page.description.length, page.description).toBeGreaterThanOrEqual(70);
				expect(page.description.length, page.description).toBeLessThanOrEqual(160);
			}
		}
	});

	it('gives every page a distinct title and description', () => {
		const pages = LANGS.flatMap((lang) => {
			const strings = t(lang);
			return [strings.home, strings.projects, strings.contact];
		});
		expect(new Set(pages.map((page) => page.title)).size).toBe(PAGE_PATHS.length * LANGS.length);
		expect(new Set(pages.map((page) => page.description)).size).toBe(
			PAGE_PATHS.length * LANGS.length
		);
	});
});
