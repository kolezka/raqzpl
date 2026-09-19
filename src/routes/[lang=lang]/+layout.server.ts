import type { LayoutServerLoad } from './$types';
import type { Lang } from '$lib/i18n';

// The language is the first path segment, already validated by the `lang` matcher.
// Every page reads it from `page.data.lang`.
export const load: LayoutServerLoad = ({ params }) => ({ lang: params.lang as Lang });
