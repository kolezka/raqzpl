import { sitemapXml } from '$lib/seo';
import type { RequestHandler } from './$types';

// Each entry lists every language plus `x-default` as alternates, which is how Google
// reads a multilingual sitemap.
export const GET: RequestHandler = () =>
	new Response(sitemapXml(), {
		headers: {
			'content-type': 'application/xml',
			'cache-control': 'public, max-age=3600'
		}
	});
