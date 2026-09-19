import type { ParamMatcher } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';

// Only `en` and `pl` are real languages, so `/en/...` and `/pl/...` route here while
// any other first segment falls through to the redirect in `hooks.server.ts`.
export const match = ((param) => isLang(param)) satisfies ParamMatcher;
