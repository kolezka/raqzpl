import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';
import { LANG_COOKIE } from '$lib/i18n';

/**
 * A stand in for the SvelteKit request event, with only the parts the hook reads.
 * `serialize` mirrors what SvelteKit builds, so the test sees the real header.
 */
function fakeEvent(url: string, cookies: Record<string, string> = {}) {
	return {
		url: new URL(url),
		locals: {},
		request: new Request(url),
		cookies: {
			get: (name: string) => cookies[name],
			serialize: (name: string, value: string, options: Record<string, unknown>) => {
				const parts = [`${name}=${value}`, `Path=${options.path}`, `Max-Age=${options.maxAge}`];
				if (options.secure) parts.push('Secure');
				return parts.join('; ');
			}
		}
	} as never;
}

const resolve = async () => new Response('page');

describe('language switch', () => {
	it('answers ?lang=pl with the cookie and a clean address', async () => {
		const response = await handle({ event: fakeEvent('https://raqz.pl/projects?lang=pl'), resolve });

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/projects');
		expect(response.headers.get('set-cookie')).toContain(`${LANG_COOKIE}=pl`);
	});

	// The bug this guards: Cloudflare stored the redirect and served copies of it
	// without the `set-cookie`, so the language never changed. Any shared cache
	// must keep its hands off this response.
	it('keeps the switch out of every cache', async () => {
		const response = await handle({ event: fakeEvent('https://raqz.pl/?lang=pl'), resolve });

		const cacheControl = response.headers.get('cache-control') ?? '';
		expect(cacheControl).toContain('no-store');
		expect(cacheControl).toContain('private');
	});

	it('leaves other requests alone', async () => {
		const response = await handle({ event: fakeEvent('https://raqz.pl/'), resolve });

		expect(response.status).toBe(200);
		expect(response.headers.get('set-cookie')).toBe(null);
	});
});
