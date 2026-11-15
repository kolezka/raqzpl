// The visitor's Google Analytics choice, shared by the banner and the privacy page.
import { applyConsent, readConsent, saveConsent, type Consent } from './analytics';

export const consent = $state<{ value: Consent | null; ready: boolean }>({
	value: null,
	ready: false
});

function localStore(): Storage | undefined {
	try {
		return window.localStorage;
	} catch {
		// Some browsers throw on the getter itself when storage is blocked.
		return undefined;
	}
}

/** Runs once in the browser: loads GA4 and applies an earlier answer, if any. */
export function initConsent(): void {
	consent.value = readConsent(localStore());
	consent.ready = true;
	applyConsent(window, document, consent.value);
}

export function choose(value: Consent): void {
	saveConsent(localStore(), value);
	consent.value = value;
	applyConsent(window, document, value);
}
