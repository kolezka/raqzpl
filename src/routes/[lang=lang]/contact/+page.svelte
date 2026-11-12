<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { t } from '$lib/i18n';
	import { PROFILES } from '$lib/seo';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let sending = $state(false);

	const strings = $derived(t(page.data.lang));

	const channels = [
		{ label: 'email', value: 'hello@raqz.pl', href: 'mailto:hello@raqz.pl', external: false },
		{ label: 'github', value: 'github.com/kolezka', href: PROFILES.github, external: true },
		{
			label: 'linkedin',
			value: 'in/mariusz-rakus',
			href: PROFILES.linkedin,
			external: true
		}
	];
</script>

<PageMeta title={strings.contact.title} description={strings.contact.description} />

<h1 class="page-title">{strings.contact.heading}</h1>
<p class="lead">{strings.contact.lead}</p>

<h2 class="section"><span>{strings.contact.channels}</span></h2>
<dl class="channels">
	{#each channels as channel (channel.label)}
		<dt>{channel.label}</dt>
		<dd>
			{#if channel.external}
				<a href={channel.href} target="_blank" rel="noreferrer">{channel.value}</a>
				<span class="ext">↗</span>
			{:else}
				<a href={channel.href}>{channel.value}</a>
			{/if}
		</dd>
	{/each}
</dl>

<h2 class="section"><span>{strings.contact.formHeading}</span></h2>

{#if form?.success}
	<p class="sent" role="status">{strings.contact.sent}</p>
{:else}
	<form
		method="POST"
		use:enhance={() => {
			sending = true;
			return async ({ update }) => {
				await update();
				sending = false;
			};
		}}
	>
		<label>
			<span>{strings.contact.name}</span>
			<input name="name" type="text" maxlength="120" required value={form?.values?.name ?? ''} />
		</label>

		<label>
			<span>{strings.contact.email}</span>
			<input name="email" type="email" maxlength="254" required value={form?.values?.email ?? ''} />
		</label>

		<label>
			<span>{strings.contact.message}</span>
			<textarea name="message" rows="6" maxlength="5000" required
				>{form?.values?.message ?? ''}</textarea
			>
		</label>

		<!-- Honeypot. Hidden from people, tempting to bots. -->
		<input class="trap" name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />

		{#if form?.error}
			<p class="error" role="alert">{form.error}</p>
		{/if}

		<button type="submit" disabled={sending}
			>{sending ? strings.contact.sending : strings.contact.send}</button
		>
	</form>
{/if}

<style>
	.channels {
		display: grid;
		grid-template-columns: 110px minmax(0, 1fr);
	}

	dt,
	dd {
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		padding-top: 16px;
		font: 12px var(--mono);
		color: var(--muted);
	}

	dd {
		font-size: 20px;
		overflow-wrap: anywhere;
	}

	.ext {
		font: 12px var(--mono);
		color: var(--faint);
	}

	form {
		display: grid;
		gap: 22px;
		margin-top: 24px;
	}

	label {
		display: grid;
		gap: 4px;
	}

	label span {
		font: 11px var(--mono);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}

	input,
	textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: 2px;
		background: var(--field);
		color: var(--fg);
		font: inherit;
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		outline: 2px solid var(--acc);
		outline-offset: 1px;
	}

	.trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
	}

	button {
		justify-self: start;
		padding: 11px 22px;
		border: 0;
		border-radius: 2px;
		background: var(--acc);
		color: var(--bg);
		font: 14px var(--mono);
		cursor: pointer;
	}

	button:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.error {
		color: var(--err);
	}

	.sent {
		margin-top: 24px;
		padding: 16px 0;
		border-top: 2px solid var(--acc);
		font-size: 20px;
	}

	@media (max-width: 640px) {
		.channels {
			grid-template-columns: 1fr;
		}

		dt {
			padding: 12px 0 0;
			border: 0;
		}

		dd {
			padding-top: 0;
		}
	}
</style>
