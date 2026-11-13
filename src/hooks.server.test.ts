import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';

/**
 * A stand in for the SvelteKit request event, with only the parts the hook reads.
 */
function fakeEvent(url: string) {
	return {
		url: new URL(url),
		locals: {} as App.Locals,
		request: new Request(url)
	};
}

const resolve = async () => new Response('page');

describe('language routing', () => {
	// The core SEO fix: a flat URL left over from before the path migration must return a
	// permanent redirect, not a temporary one. A 307 tells Google to keep the old URL and
	// pass no ranking, which is what left the old pages stuck under "Page with redirect".
	it('redirects a flat URL permanently to the default language', async () => {
		const response = await handle({ event: fakeEvent('https://raqz.pl/projects') as never, resolve });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/en/projects');
		expect(response.headers.get('set-cookie')).toBe(null);
	});

	it('redirects the bare root permanently to the default language', async () => {
		const response = await handle({ event: fakeEvent('https://raqz.pl/') as never, resolve });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/en');
	});

	it('keeps the query string on the redirect', async () => {
		const response = await handle({
			event: fakeEvent('https://raqz.pl/contact?ref=x') as never,
			resolve
		});

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/en/contact?ref=x');
	});

	// Old pages used trailing slashes. Dropping it here saves a second (308) hop.
	it('drops the trailing slash of an old URL in the same redirect', async () => {
		const response = await handle({
			event: fakeEvent('https://raqz.pl/services/ai-integrations/') as never,
			resolve
		});

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/en/services/ai-integrations');
	});

	// The redirect must not depend on the visitor. Googlebot sends no `Accept-Language`,
	// and Google warns that auto-redirecting between languages blocks crawling, so the
	// same old URL always maps to the same localized one.
	it('ignores Accept-Language and always uses the default', async () => {
		const event = fakeEvent('https://raqz.pl/');
		event.request.headers.set('accept-language', 'pl,en;q=0.8');
		const response = await handle({ event: event as never, resolve });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('/en');
	});

	it('serves a language-prefixed URL without redirecting', async () => {
		const event = fakeEvent('https://raqz.pl/pl/projects');
		const response = await handle({ event: event as never, resolve });

		expect(response.status).toBe(200);
		expect(event.locals.lang).toBe('pl');
	});

	it('leaves assets and files alone', async () => {
		for (const path of ['/sitemap.xml', '/favicon.svg', '/_app/immutable/x.js']) {
			const response = await handle({ event: fakeEvent(`https://raqz.pl${path}`) as never, resolve });
			expect(response.status).toBe(200);
		}
	});
});

// The same app answers on the owner's other domains. Each must send visitors and
// Google to the same page on raqz.pl in one hop, so search sees one site, not five.
describe('alias domains', () => {
	const cases: [string, string][] = [
		['https://raqz.link/en/projects', 'https://raqz.pl/en/projects'],
		['https://raqz.app/', 'https://raqz.pl/en'],
		['https://raqz.contact/contact?ref=x', 'https://raqz.pl/en/contact?ref=x'],
		['https://rakus.dev/services/ai-integrations/', 'https://raqz.pl/en/services/ai-integrations'],
		['https://raqz.link/sitemap.xml', 'https://raqz.pl/sitemap.xml']
	];

	for (const [from, to] of cases) {
		it(`redirects ${from} to ${to}`, async () => {
			const response = await handle({ event: fakeEvent(from) as never, resolve });

			expect(response.status).toBe(301);
			expect(response.headers.get('location')).toBe(to);
		});
	}

	it('serves raqz.pl and local hosts without a host redirect', async () => {
		for (const url of ['https://raqz.pl/en', 'http://localhost:3000/en', 'http://127.0.0.1:4173/pl/projects']) {
			const response = await handle({ event: fakeEvent(url) as never, resolve });
			expect(response.status, url).toBe(200);
		}
	});
});
