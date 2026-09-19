import type { Handle } from '@sveltejs/kit';
import { LANG_COOKIE, LANG_PARAM, isLang, pickLang } from '$lib/i18n';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	// `?lang=pl` stores the choice and then leaves the URL, so every page has one
	// address. The links carry `data-sveltekit-reload`, so this runs on a document
	// request and the redirect lands on a clean URL.
	const requested = event.url.searchParams.get(LANG_PARAM);
	if (isLang(requested)) {
		const target = new URL(event.url);
		target.searchParams.delete(LANG_PARAM);

		// The response is built by hand instead of with `redirect()`, because it needs
		// its own `cache-control`. Cloudflare sits in front of the site and stores
		// redirects. A stored copy loses the `set-cookie`, so the browser gets a
		// redirect without the language and the choice never sticks. `no-store` keeps
		// this response out of the CDN and out of the browser cache.
		return new Response(null, {
			status: 303,
			headers: {
				location: `${target.pathname}${target.search}`,
				'cache-control': 'private, no-store',
				'set-cookie': event.cookies.serialize(LANG_COOKIE, requested, {
					path: '/',
					maxAge: YEAR_SECONDS,
					httpOnly: false,
					sameSite: 'lax',
					// SvelteKit defaults `secure` to true off localhost. Over plain http on a LAN
					// IP or behind an http proxy the browser then drops the cookie and the choice
					// never sticks. Mark it secure only on https, where the browser keeps it.
					secure: event.url.protocol === 'https:'
				})
			}
		});
	}

	event.locals.lang = pickLang(
		event.cookies.get(LANG_COOKIE),
		event.request.headers.get('accept-language')
	);

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});

	// The document is rendered for one language cookie, so no shared cache (CDN) and no
	// browser may reuse one visitor's language for another. `private, no-cache` lets the
	// browser keep it but revalidate every time, and `Vary: Cookie` stops any cache from
	// serving one cookie's page to a different cookie. Without this a CDN that caches
	// html serves a stale language and the switch looks broken.
	if (response.headers.get('content-type')?.startsWith('text/html')) {
		response.headers.set('cache-control', 'private, no-cache');
		response.headers.append('vary', 'Cookie');
	}
	return response;
};
