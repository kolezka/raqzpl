import { redirect } from '@sveltejs/kit';
import type { Lang } from '$lib/i18n';
import { resolveServicePage, servicePaths } from '$lib/services';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const result = resolveServicePage(params.lang as Lang, params.section, undefined);
	if (result.kind === 'redirect') redirect(301, result.location);
	return { paths: servicePaths() };
};
