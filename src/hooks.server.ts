import { type Handle } from '@sveltejs/kit';
import { LANG_COOKIE, isLang, pickLang } from '$lib/i18n';

// The language lives in the first path segment (`/en`, `/pl`), so every language has its
// own crawlable URL. A request without a language is redirected to the visitor's
// preferred one. Assets and files like `/sitemap.xml` keep their bare paths.
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;
	const segment = pathname.split('/')[1] ?? '';

	if (isLang(segment)) {
		event.locals.lang = segment;
	} else {
		const preferred = pickLang(
			event.cookies.get(LANG_COOKIE),
			event.request.headers.get('accept-language')
		);

		// Leave the build assets and files (`/_app/...`, `/robots.txt`, `/favicon.svg`) alone.
		const isAsset = pathname.startsWith('/_app/') || /\.[a-z0-9]+$/i.test(pathname);
		if (!isAsset) {
			// `no-store`, because the target depends on the visitor. A cached redirect would
			// send everyone to one language, the exact bug that broke the switch before.
			return new Response(null, {
				status: 307,
				headers: {
					location: `/${preferred}${pathname === '/' ? '' : pathname}${search}`,
					'cache-control': 'no-store'
				}
			});
		}

		event.locals.lang = preferred;
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
