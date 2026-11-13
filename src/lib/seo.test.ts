import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { alternateLinks, jsonLdScript, llmsTxt, ogLocale, siteJsonLd, sitemapXml } from './seo';
import { LANGS, PAGE_PATHS, t } from './i18n';
import { projects } from './projects';

describe('sitemapXml', () => {
	const xml = sitemapXml();
	const urls = [...xml.matchAll(/<url>(.*?)<\/url>/g)].map((match) => match[1]);

	it('lists every page in every language, each with all alternates', () => {
		const locs = urls.map((url) => url.match(/<loc>(.*?)<\/loc>/)?.[1]);
		expect(locs.sort()).toEqual(
			PAGE_PATHS.flatMap((path) => LANGS.map((lang) => `https://raqz.pl/${lang}${path}`)).sort()
		);
		for (const url of urls) {
			expect(url.match(/hreflang="(.*?)"/g)).toEqual([
				'hreflang="en"',
				'hreflang="pl"',
				'hreflang="x-default"'
			]);
		}
	});

	// A sitemap entry without a page behind it is a 404 Google keeps retrying.
	it('lists only paths that have a page route', () => {
		for (const path of PAGE_PATHS) {
			expect(existsSync(`src/routes/[lang=lang]${path}/+page.svelte`), path).toBe(true);
		}
	});

	it('declares both namespaces it uses', () => {
		expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
		expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
	});
});

describe('llmsTxt', () => {
	const text = llmsTxt();

	it('follows the llms.txt layout: title, summary, then link sections', () => {
		expect(text.startsWith('# raqz.pl\n\n> ')).toBe(true);
		expect(text).toMatch(/^## Pages$/m);
		expect(text).toMatch(/^## Projects$/m);
		expect(text).toContain('[Projects](https://raqz.pl/en/projects)');
		expect(text).toContain('[Contact](https://raqz.pl/en/contact)');
	});

	it('lists every project once, linking source or its anchor on the site', () => {
		for (const project of projects) {
			const lines = text.split('\n').filter((line) => line.startsWith(`- [${project.name}](`));
			expect(lines, project.name).toHaveLength(1);
			expect(lines[0]).toContain(project.href ?? 'https://raqz.pl/en/projects#');
		}
	});
});

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
