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
