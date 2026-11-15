// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Lang } from '$lib/i18n';
import type { LocalizedPaths } from '$lib/seo';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			lang: Lang;
		}
		interface PageData {
			lang: Lang;
			/** Set by pages whose path differs per language (the service pages). */
			paths?: LocalizedPaths;
		}
		// interface PageState {}
		// interface Platform {}
	}

	// Globals set by the analytics scripts, see src/lib/analytics.ts.
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		umami?: { track(event: string, data?: Record<string, string>): unknown };
	}

	// User-Agent Client Hints. Chromium only, so it stays optional.
	interface Navigator {
		userAgentData?: {
			getHighEntropyValues(hints: string[]): Promise<{ model?: string }>;
		};
	}
}

export {};
