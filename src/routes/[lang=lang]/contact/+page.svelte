<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let sending = $state(false);

	const strings = $derived(t(page.data.lang));

	const channels = [
		{ label: 'email', value: 'hello@raqz.pl', href: 'mailto:hello@raqz.pl' },
		{ label: 'github', value: 'github.com/kolezka', href: 'https://github.com/kolezka' },
		{
			label: 'linkedin',
			value: 'in/mariusz-rakus',
			href: 'https://www.linkedin.com/in/mariusz-rakus/'
		}
	];

	const domains = ['raqz.pl', 'raqz.dev', 'raqz.link', 'raqz.app', 'raqz.contact'];
</script>

<svelte:head>
	<title>{strings.contact.title}</title>
	<meta name="description" content={strings.contact.description} />
</svelte:head>

<section class="view">
	<div class="view-inner">
		<h1>{strings.contact.heading}</h1>
		<p class="lead">{strings.contact.lead}</p>

		<ul class="rows">
			{#each channels as channel (channel.label)}
				<li>
					<span class="k">{channel.label}</span>
					<a class="link" href={channel.href} target="_blank" rel="noreferrer">{channel.value}</a>
				</li>
			{/each}
		</ul>

		<h2>{strings.contact.formHeading}</h2>

		{#if form?.success}
			<p class="note ok">{strings.contact.sent}</p>
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
					<span class="k">{strings.contact.name}</span>
					<input name="name" type="text" maxlength="120" required value={form?.values?.name ?? ''} />
				</label>

				<label>
					<span class="k">{strings.contact.email}</span>
					<input
						name="email"
						type="email"
						maxlength="254"
						required
						value={form?.values?.email ?? ''}
					/>
				</label>

				<label>
					<span class="k">{strings.contact.message}</span>
					<textarea name="message" rows="6" maxlength="5000" required
						>{form?.values?.message ?? ''}</textarea
					>
				</label>

				<!-- Honeypot. Hidden from people, tempting to bots. -->
				<input
					class="trap"
					name="company"
					type="text"
					tabindex="-1"
					autocomplete="off"
					aria-hidden="true"
				/>

				{#if form?.error}
					<p class="note error">{form.error}</p>
				{/if}

				<button type="submit" disabled={sending}
					>{sending ? strings.contact.sending : strings.contact.send}</button
				>
			</form>
		{/if}

		<p class="domains muted">{domains.join('  ·  ')}</p>
	</div>
</section>

<style>
	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		display: flex;
		gap: 1.5rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.k {
		width: 6rem;
		align-self: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h2 {
		margin: 2.5rem 0 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label .k {
		width: auto;
	}

	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 0.6rem 0.7rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.18);
		color: #ffffff;
		font: inherit;
		resize: vertical;
		transition: border-color 0.15s ease;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.7);
	}

	.trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
	}

	button {
		align-self: flex-start;
		padding: 0.6rem 1.2rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.35);
		color: #ffffff;
		font: inherit;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	button:hover:not(:disabled) {
		border-color: #ffffff;
		background: rgba(255, 255, 255, 0.06);
	}

	button:disabled {
		cursor: default;
		opacity: 0.5;
	}

	.note {
		margin: 0;
		font-size: 0.9rem;
	}

	.note.ok {
		color: rgba(255, 255, 255, 0.8);
	}

	.note.error {
		color: #ff8a8a;
	}

	.domains {
		margin-top: 2rem;
		font-size: 0.85rem;
	}
</style>
