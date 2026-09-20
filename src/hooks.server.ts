import { type Handle } from '@sveltejs/kit';
import { DEFAULT_LANG, isLang } from '$lib/i18n';

// The language lives in the first path segment (`/en`, `/pl`), so every language has its
// own crawlable URL. A request without a language segment is a leftover flat URL from
// before the path migration; redirect it permanently (301) to the default language so
// Google drops the old address and keeps the localized one. We do not auto-redirect by
// `Accept-Language`: Googlebot sends none and crawls from the US, and Google warns that
// auto-redirecting between languages blocks crawling of the other versions. Visitors
// choose a language with the switch in the nav. Assets and files like `/sitemap.xml`
// keep their bare paths.
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;
	const segment = pathname.split('/')[1] ?? '';

	if (isLang(segment)) {
		event.locals.lang = segment;
	} else {
		// Leave the build assets and files (`/_app/...`, `/robots.txt`, `/favicon.svg`) alone.
		const isAsset = pathname.startsWith('/_app/') || /\.[a-z0-9]+$/i.test(pathname);
		if (!isAsset) {
			// 301, deterministic and cacheable: the same old URL always maps to the same
			// localized one. `/` becomes `/en`, `/projects` becomes `/en/projects`.
			return new Response(null, {
				status: 301,
				headers: {
					location: `/${DEFAULT_LANG}${pathname === '/' ? '' : pathname}${search}`
				}
			});
		}

		event.locals.lang = DEFAULT_LANG;
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
