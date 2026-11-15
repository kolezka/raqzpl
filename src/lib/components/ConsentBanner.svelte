<script lang="ts">
	import { page } from '$app/state';
	import { choose, consent } from '$lib/consent.svelte';
	import { t, withLang } from '$lib/i18n';

	const strings = $derived(t(page.data.lang));
</script>

{#if consent.ready && consent.value === null}
	<section class="consent" aria-label={strings.consent.label}>
		<p>
			{strings.consent.text}
			<a href={withLang(page.data.lang, '/privacy')}>{strings.consent.policy}</a>
		</p>
		<div class="actions">
			<button type="button" onclick={() => choose('denied')}>{strings.consent.reject}</button>
			<button type="button" class="primary" onclick={() => choose('granted')}>
				{strings.consent.accept}
			</button>
		</div>
	</section>
{/if}

<style>
	.consent {
		position: fixed;
		right: 16px;
		bottom: 16px;
		left: 16px;
		z-index: 50;
		max-width: 560px;
		margin-left: auto;
		padding: 16px 18px;
		border: 1px solid var(--line);
		background: var(--field);
		color: var(--fg);
		font: 14px/1.5 var(--serif);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 12px;
	}

	/* Both answers get the same size and weight, so refusing is as easy as accepting. */
	button {
		padding: 6px 14px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--fg);
		font: 13px var(--mono);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--acc);
		color: var(--acc);
	}

	.primary {
		border-color: var(--fg);
	}
</style>
