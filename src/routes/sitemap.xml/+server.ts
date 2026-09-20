import { DEFAULT_LANG, LANGS, PAGE_PATHS, SITE_URL } from '$lib/i18n';
import type { RequestHandler } from './$types';

// One entry per language per page. Each entry lists every language plus `x-default` as
// alternates, which is how Google reads a multilingual sitemap.
export const GET: RequestHandler = () => {
	const entries = PAGE_PATHS.flatMap((path) =>
		LANGS.map((lang) => {
			const alternates = LANGS.map(
				(code) =>
					`<xhtml:link rel="alternate" hreflang="${code}" href="${SITE_URL}/${code}${path}"/>`
			).join('');
			const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/${DEFAULT_LANG}${path}"/>`;
			return `<url><loc>${SITE_URL}/${lang}${path}</loc>${alternates}${xDefault}</url>`;
		})
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml',
			'cache-control': 'public, max-age=3600'
		}
	});
};
