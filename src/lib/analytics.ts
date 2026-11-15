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

// ---------------------------------------------------------------------------
// Umami: extra events on top of page views. Umami sets no cookies, so these run
// without consent. None of them carries what a visitor typed.

type HighEntropyValues = { model?: string; platformVersion?: string };

type HighEntropyNavigator = {
	userAgentData?: {
		getHighEntropyValues(hints: string[]): Promise<HighEntropyValues>;
	};
};

export type DeviceInfo = {
	model: string;
	/** Android version, e.g. `16.0.0`. Missing when the browser does not say. */
	android?: string;
	/** Samsung foldables, told apart by model code. */
	foldable?: 'flip' | 'fold';
};

/**
 * Samsung model codes: SM-F7xx are Galaxy Z Flips (SM-F731B is the Flip5), SM-F9xx
 * are Galaxy Z Folds. Other brands have no stable pattern, so they get nothing.
 */
export function samsungFoldable(model: string): 'flip' | 'fold' | undefined {
	if (/^SM-F7\d\d/i.test(model)) return 'flip';
	if (/^SM-F9\d\d/i.test(model)) return 'fold';
	return undefined;
}

/**
 * The phone model and Android version. Only Chromium browsers report them (Chrome,
 * Samsung Internet, Edge on Android). Desktops answer with an empty model and Safari
 * has no API at all; both give null.
 */
export async function readDeviceInfo(nav: HighEntropyNavigator): Promise<DeviceInfo | null> {
	if (!nav.userAgentData) return null;
	const values = await nav.userAgentData.getHighEntropyValues(['model', 'platformVersion']);
	const model = values.model?.trim();
	if (!model) return null;
	const info: DeviceInfo = { model };
	const android = values.platformVersion?.trim();
	if (android) info.android = android;
	const foldable = samsungFoldable(model);
	if (foldable) info.foldable = foldable;
	return info;
}

type UmamiTracker = {
	track(event: string, data?: Record<string, string>): unknown;
	identify(data: Record<string, string>): unknown;
};

type UmamiWindow = { umami?: UmamiTracker };

type Wait = (ms: number) => Promise<void>;

const sleep: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Umami loads with `defer`; give it up to five seconds. An ad blocker means never. */
async function waitForUmami(win: UmamiWindow, wait: Wait): Promise<UmamiTracker | undefined> {
	for (let attempt = 0; attempt < 20 && !win.umami; attempt++) {
		await wait(250);
	}
	return win.umami;
}

/** Sends one event if Umami is there. A blocked tracker is normal, not an error. */
export function trackEvent(win: UmamiWindow, event: string, data?: Record<string, string>): void {
	win.umami?.track(event, data);
}

/**
 * Attaches the device to the Umami session (so every report can be filtered by
 * model) and sends a `device-model` event, once per browser session.
 */
export async function trackDeviceModel(
	win: UmamiWindow,
	nav: HighEntropyNavigator,
	session: KeyValueStorage | undefined,
	wait: Wait = sleep
): Promise<'sent' | 'already-sent' | 'no-model' | 'no-umami'> {
	if (readFlag(session)) return 'already-sent';

	const info = await readDeviceInfo(nav);
	if (!info) return 'no-model';

	const umami = await waitForUmami(win, wait);
	if (!umami) return 'no-umami';

	umami.identify({ ...info });
	umami.track('device-model', { ...info });
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

export type LinkTarget = { kind: 'email' | 'outbound'; target: string };

/**
 * What a clicked link leads to, or null for links inside the site. Email links
 * report only that they are email links; outbound links report host and path,
 * without the query string, which can carry personal data.
 */
export function classifyLink(href: string, currentHost: string): LinkTarget | null {
	let url: URL;
	try {
		url = new URL(href, `https://${currentHost}/`);
	} catch {
		return null;
	}
	if (url.protocol === 'mailto:') return { kind: 'email', target: 'email' };
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	if (url.host === currentHost) return null;
	const path = url.pathname === '/' ? '' : url.pathname;
	return { kind: 'outbound', target: `${url.host}${path}` };
}

export const SCROLL_MILESTONES = [25, 50, 75, 100] as const;
export const TIME_MILESTONES = [15, 30, 60, 120, 300] as const;

/**
 * How far down the page the visitor got, in percent. The last 2% count as the
 * end, because a footer rarely scrolls fully into view.
 */
export function scrollPercent(scrollY: number, viewportHeight: number, pageHeight: number): number {
	if (pageHeight <= viewportHeight) return 100;
	const percent = ((scrollY + viewportHeight) / pageHeight) * 100;
	return percent >= 98 ? 100 : Math.max(0, Math.floor(percent));
}

/** Milestones reached now that were not reported yet, in order. */
export function newMilestones(
	value: number,
	milestones: readonly number[],
	reported: Set<number>
): number[] {
	return milestones.filter((milestone) => value >= milestone && !reported.has(milestone));
}

type FormResult = { type: 'success' | 'failure' | 'error' | 'redirect'; status?: number };

/** The contact form outcome, without anything the visitor typed. */
export function contactResult(result: FormResult): 'sent' | 'invalid' | 'mail-failed' | 'error' {
	if (result.type === 'success' || result.type === 'redirect') return 'sent';
	if (result.type === 'failure') return result.status === 400 ? 'invalid' : 'mail-failed';
	return 'error';
}
