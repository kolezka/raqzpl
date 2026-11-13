import { llmsTxt } from '$lib/seo';
import type { RequestHandler } from './$types';

// AI crawlers already ask for /llms.txt (seen in the production logs).
export const GET: RequestHandler = () =>
	new Response(llmsTxt(), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
