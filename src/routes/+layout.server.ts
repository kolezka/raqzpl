import type { LayoutServerLoad } from './$types';

// The language is resolved once per request in `src/hooks.server.ts`. Every page
// reads it from `page.data.lang`.
export const load: LayoutServerLoad = ({ locals }) => ({ lang: locals.lang });
