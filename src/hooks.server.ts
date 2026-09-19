import { redirect, type Handle } from '@sveltejs/kit';
import { LANG_COOKIE, LANG_PARAM, isLang, pickLang } from '$lib/i18n';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	// `?lang=pl` stores the choice and then leaves the URL, so every page has one
	// address. The links carry `data-sveltekit-reload`, so this runs on a document
	// request and the redirect lands on a clean URL.
	const requested = event.url.searchParams.get(LANG_PARAM);
	if (isLang(requested)) {
		event.cookies.set(LANG_COOKIE, requested, {
			path: '/',
			maxAge: YEAR_SECONDS,
			httpOnly: false,
			sameSite: 'lax',
			// SvelteKit defaults `secure` to true off localhost. Over plain http on a LAN
			// IP or behind an http proxy the browser then drops the cookie and the choice
			// never sticks. Mark it secure only on https, where the browser keeps it.
			secure: event.url.protocol === 'https:'
		});

		const target = new URL(event.url);
		target.searchParams.delete(LANG_PARAM);
		redirect(303, `${target.pathname}${target.search}`);
	}

	event.locals.lang = pickLang(
		event.cookies.get(LANG_COOKIE),
		event.request.headers.get('accept-language')
	);

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
