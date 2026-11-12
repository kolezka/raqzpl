import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANGS } from './i18n';
import { projects } from './projects';
import { sitemapXml } from './seo';
import { resolveServicePage, servicePaths, services } from './services';

const byId = (id: string) => services.find((service) => service.id === id)!;

describe('resolveServicePage', () => {
	it('serves each service at its localized address', () => {
		expect(resolveServicePage('pl', 'uslugi', 'boty-telegram')).toEqual({
			kind: 'page',
			service: byId('telegram-bots')
		});
		expect(resolveServicePage('en', 'services', 'ai-integrations')).toEqual({
			kind: 'page',
			service: byId('ai-integrations')
		});
		expect(resolveServicePage('pl', 'uslugi', undefined)).toEqual({ kind: 'page' });
	});

	it('redirects a section or slug from the other language to the localized address', () => {
		expect(resolveServicePage('en', 'uslugi', 'boty-telegram')).toEqual({
			kind: 'redirect',
			location: '/en/services/telegram-bots'
		});
		expect(resolveServicePage('pl', 'services', 'telegram-bots')).toEqual({
			kind: 'redirect',
			location: '/pl/uslugi/boty-telegram'
		});
		expect(resolveServicePage('pl', 'uslugi', 'telegram-bots')).toEqual({
			kind: 'redirect',
			location: '/pl/uslugi/boty-telegram'
		});
		expect(resolveServicePage('en', 'uslugi', undefined)).toEqual({
			kind: 'redirect',
			location: '/en/services'
		});
	});

	it('sends retired service pages to the overview', () => {
		expect(resolveServicePage('en', 'services', 'web-development')).toEqual({
			kind: 'redirect',
			location: '/en/services'
		});
	});

	// Old URLs that still get impressions in Search Console (after the hook adds `/en`
	// and drops the trailing slash). Each must end on a page, not a 404.
	it('lands every legacy URL from Search Console on a page', () => {
		const legacy: [string, string, string | undefined][] = [
			['pl', 'uslugi', 'boty-telegram'],
			['pl', 'uslugi', 'boty-discord'],
			['pl', 'uslugi', undefined],
			['en', 'services', 'ai-integrations'],
			['en', 'services', 'web-development'],
			['en', 'services', 'software-development'],
			['en', 'services', undefined]
		];
		for (const [lang, section, slug] of legacy) {
			let result = resolveServicePage(lang as 'en' | 'pl', section, slug);
			if (result.kind === 'redirect') {
				const [, nextLang, nextSection, nextSlug] = result.location.split('/');
				result = resolveServicePage(nextLang as 'en' | 'pl', nextSection, nextSlug);
			}
			expect(result.kind, `${lang}/${section}/${slug}`).toBe('page');
		}
	});
});

describe('service data', () => {
	it('links only to projects that exist', () => {
		const names = new Set(projects.map((project) => project.name));
		for (const service of services) {
			for (const name of service.projects) expect(names.has(name), name).toBe(true);
		}
	});

	it('keeps titles and descriptions inside the length search results show', () => {
		for (const service of services) {
			for (const lang of LANGS) {
				const { title, description } = service.copy[lang];
				expect(title.length, title).toBeLessThanOrEqual(65);
				expect(description.length, description).toBeGreaterThanOrEqual(70);
				expect(description.length, description).toBeLessThanOrEqual(160);
			}
		}
	});
});

describe('sitemap', () => {
	it('lists each service page with its localized alternates', () => {
		const xml = sitemapXml();
		const entry = xml.match(/<url><loc>https:\/\/raqz\.pl\/pl\/uslugi\/boty-telegram<\/loc>(.*?)<\/url>/);
		expect(entry?.[1]).toContain('hreflang="en" href="https://raqz.pl/en/services/telegram-bots"');
		expect(entry?.[1]).toContain('hreflang="x-default" href="https://raqz.pl/en/services/telegram-bots"');
		expect(xml).toContain('<loc>https://raqz.pl/en/services</loc>');
		expect(servicePaths(byId('discord-bots'))).toEqual({
			en: '/services/discord-bots',
			pl: '/uslugi/boty-discord'
		});
	});
});

// Owner's rule: the service pages are reached from search, never from the main pages.
describe('main pages', () => {
	it('do not link to the service pages', () => {
		for (const file of [
			'src/lib/components/Masthead.svelte',
			'src/lib/components/Colophon.svelte',
			'src/routes/[lang=lang]/+page.svelte',
			'src/routes/[lang=lang]/projects/+page.svelte',
			'src/routes/[lang=lang]/contact/+page.svelte'
		]) {
			expect(readFileSync(file, 'utf8'), file).not.toMatch(/services|uslugi/);
		}
	});
});
