import { type Handle } from '@sveltejs/kit';
import { DEFAULT_LANG, SITE_URL, isLang } from '$lib/i18n';

// The language lives in the first path segment (`/en`, `/pl`), so every language has its
// own crawlable URL. A request without a language segment is a leftover flat URL from
// before the path migration; redirect it permanently (301) to the default language so
// Google drops the old address and keeps the localized one. We do not auto-redirect by
// `Accept-Language`: Googlebot sends none and crawls from the US, and Google warns that
// auto-redirecting between languages blocks crawling of the other versions. Visitors
// choose a language with the switch in the nav. Assets and files like `/sitemap.xml`
// keep their bare paths.
// The app also answers on these domains (Coolify routes them all here). They redirect
// to raqz.pl so search engines see one site instead of five copies.
const ALIAS_HOSTS = new Set(['rakus.dev', 'raqz.link', 'raqz.contact', 'raqz.app']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search, hostname } = event.url;
	const segment = pathname.split('/')[1] ?? '';
	// Leave the build assets and files (`/_app/...`, `/robots.txt`, `/favicon.svg`) alone.
	const isAsset = pathname.startsWith('/_app/') || /\.[a-z0-9]+$/i.test(pathname);
	// Deterministic: the same old URL always maps to the same localized one. `/` becomes
	// `/en`, `/projects` becomes `/en/projects`. Old pages ended in `/`; dropping it here
	// saves the router a second redirect.
	const target =
		isLang(segment) || isAsset ? pathname : `/${DEFAULT_LANG}${pathname.replace(/\/+$/, '')}`;

	if (ALIAS_HOSTS.has(hostname)) {
		return new Response(null, { status: 301, headers: { location: `${SITE_URL}${target}${search}` } });
	}
	if (target !== pathname) {
		return new Response(null, { status: 301, headers: { location: `${target}${search}` } });
	}

	event.locals.lang = isLang(segment) ? segment : DEFAULT_LANG;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
