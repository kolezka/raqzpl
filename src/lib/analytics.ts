// Google Analytics 4 behind a consent banner, plus the phone model for Umami.
// GA4 runs in Consent Mode v2 "basic" mode: the Google script is not even loaded
// until the visitor accepts, so nothing reaches Google before that.

export const GA_MEASUREMENT_ID = 'G-CXYH9FJED4';

const CONSENT_KEY = 'raqz-consent';
const MODEL_SENT_KEY = 'raqz-device-model-sent';
const GA_SCRIPT_ID = 'ga4-gtag';

export type Consent = 'granted' | 'denied';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

type GtagWindow = {
	dataLayer?: unknown[];
	gtag?: (...args: unknown[]) => void;
};

type ScriptDocument = {
	getElementById(id: string): unknown;
	createElement(tag: 'script'): { id: string; async: boolean; src: string };
	head: { appendChild(node: unknown): unknown };
	cookie: string;
	location?: { hostname: string };
};

/** The stored choice, or null when the visitor has not answered the banner yet. */
export function readConsent(storage: KeyValueStorage | undefined): Consent | null {
	let value: string | null | undefined;
	try {
		value = storage?.getItem(CONSENT_KEY);
	} catch {
		// Storage throws when the browser blocks it (private mode, strict settings).
		// Treat that as "not answered" so the banner shows and GA4 stays off.
		return null;
	}
	return value === 'granted' || value === 'denied' ? value : null;
}

export function saveConsent(storage: KeyValueStorage | undefined, consent: Consent): void {
	try {
		storage?.setItem(CONSENT_KEY, consent);
	} catch {
		// Blocked storage: the choice applies to this page view only, which is the
		// best a browser that refuses storage allows.
	}
}

/** One choice covers both analytics and ad measurement (conversions in Google Ads). */
export function consentParams(consent: Consent): Record<string, Consent> {
	return {
		analytics_storage: consent,
		ad_storage: consent,
		ad_user_data: consent,
		ad_personalization: consent
	};
}

/**
 * Applies a consent choice. The first call defines the gtag queue with everything
 * denied. "granted" loads the Google script once; "denied" after an earlier
 * "granted" turns storage off again and removes the GA cookies.
 */
export function applyConsent(win: GtagWindow, doc: ScriptDocument, consent: Consent): void {
	win.dataLayer = win.dataLayer ?? [];
	if (!win.gtag) {
		const queue = win.dataLayer;
		// gtag.js reads the `arguments` object itself, so this must not be an arrow
		// function or a rest array.
		win.gtag = function gtag() {
			// eslint-disable-next-line prefer-rest-params
			queue.push(arguments);
		};
		win.gtag('consent', 'default', consentParams('denied'));
	}
	win.gtag('consent', 'update', consentParams(consent));

	if (consent === 'granted' && !doc.getElementById(GA_SCRIPT_ID)) {
		win.gtag('js', new Date());
		win.gtag('config', GA_MEASUREMENT_ID);
		const script = doc.createElement('script');
		script.id = GA_SCRIPT_ID;
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
		doc.head.appendChild(script);
	}

	if (consent === 'denied') {
		clearGaCookies(doc);
	}
}

function clearGaCookies(doc: ScriptDocument): void {
	const names = doc.cookie
		.split(';')
		.map((part) => part.split('=')[0].trim())
		.filter((name) => name === '_ga' || name.startsWith('_ga_'));
	const host = doc.location?.hostname;
	for (const name of names) {
		const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
		doc.cookie = expired;
		// GA sets its cookies on the registrable domain, e.g. `.raqz.pl`.
		if (host) doc.cookie = `${expired}; domain=.${host.split('.').slice(-2).join('.')}`;
	}
}

type HighEntropyNavigator = {
	userAgentData?: {
		getHighEntropyValues(hints: string[]): Promise<{ model?: string }>;
	};
};

/**
 * The phone model, e.g. `SM-F731B` for a Galaxy Z Flip5. Only Chromium browsers
 * report it (Chrome, Samsung Internet, Edge on Android). Desktops answer with an
 * empty string and Safari has no API at all; both give null.
 */
export async function readDeviceModel(nav: HighEntropyNavigator): Promise<string | null> {
	if (!nav.userAgentData) return null;
	const values = await nav.userAgentData.getHighEntropyValues(['model']);
	const model = values.model?.trim();
	return model ? model : null;
}

type UmamiWindow = {
	umami?: { track(event: string, data?: Record<string, string>): unknown };
};

type Wait = (ms: number) => Promise<void>;

const sleep: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends the phone model to Umami as a `device-model` event, once per browser session.
 * Umami loads with `defer`, so this waits a few seconds for it. When an ad blocker
 * keeps Umami away there is nothing to report to, and it gives up.
 */
export async function trackDeviceModel(
	win: UmamiWindow,
	nav: HighEntropyNavigator,
	session: KeyValueStorage | undefined,
	wait: Wait = sleep
): Promise<'sent' | 'already-sent' | 'no-model' | 'no-umami'> {
	if (readFlag(session)) return 'already-sent';

	const model = await readDeviceModel(nav);
	if (!model) return 'no-model';

	for (let attempt = 0; attempt < 20 && !win.umami; attempt++) {
		await wait(250);
	}
	if (!win.umami) return 'no-umami';

	win.umami.track('device-model', { model });
	try {
		session?.setItem(MODEL_SENT_KEY, '1');
	} catch {
		// Blocked storage: the event may repeat on the next page, which is harmless.
	}
	return 'sent';
}

function readFlag(session: KeyValueStorage | undefined): boolean {
	try {
		return session?.getItem(MODEL_SENT_KEY) === '1';
	} catch {
		return false;
	}
}
