import type { ParamMatcher } from '@sveltejs/kit';
import { LANGS } from '$lib/i18n';
import { SERVICE_SECTION } from '$lib/services';

// The services section in either language (`services`, `uslugi`). The page load
// redirects a section that does not match the page's language.
export const match = ((param) => LANGS.some((lang) => SERVICE_SECTION[lang] === param)) satisfies ParamMatcher;
