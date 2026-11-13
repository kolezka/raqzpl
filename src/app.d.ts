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
}

export {};
