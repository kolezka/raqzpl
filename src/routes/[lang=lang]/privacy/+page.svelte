<script lang="ts">
	import { page } from '$app/state';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { choose, consent } from '$lib/consent.svelte';
	import { t } from '$lib/i18n';

	const lang = $derived(page.data.lang);
	const strings = $derived(t(lang));
	const choice = $derived(
		consent.value === 'granted'
			? strings.privacy.accepted
			: consent.value === 'denied'
				? strings.privacy.rejected
				: strings.privacy.unanswered
	);
</script>

<PageMeta title={strings.privacy.title} description={strings.privacy.description} />

<h1 class="page-title">{strings.privacy.heading}</h1>

{#if lang === 'pl'}
	<div class="prose">
		<p>
			Administratorem danych jest Mariusz Rakus, kontakt: <a href="mailto:hello@raqz.pl">hello@raqz.pl</a>.
		</p>

		<h2 class="section"><span>licznik odwiedzin (Umami)</span></h2>
		<p>
			Zawsze działa Umami, uruchomione na moim własnym serwerze. Nie ustawia ciasteczek. Zapisuje
			odwiedzone podstrony, stronę, z której przychodzisz, przeglądarkę, system, typ urządzenia,
			rozmiar ekranu i kraj. Na telefonach z Androidem i przeglądarką Chrome, Samsung Internet lub
			Edge zapisuje też model telefonu i wersję systemu. Zapisuje również, jak daleko przewijasz
			stronę, ile czasu jest otwarta na wierzchu, w które linki prowadzące poza stronę klikasz i czy
			formularz kontaktowy się wysłał (bez jego treści). Umami nagrywa przebieg wizyty (ruchy i
			kliknięcia) do podglądu i map cieplnych, z częściowym maskowaniem treści. Dane nie trafiają do
			nikogo poza mną.
		</p>

		<h2 class="section"><span>Google Analytics</span></h2>
		<p>
			Tylko jeśli się zgodzisz. Wtedy Google Analytics 4 ustawia ciasteczka <span class="mono">_ga</span>
			i <span class="mono">_ga_*</span> i zbiera dane o wizycie, w tym model urządzenia i przybliżoną
			lokalizację. Te same dane pozwalają mierzyć skuteczność reklam Google Ads. Dane przetwarza Google
			Ireland Ltd i mogą one trafić na serwery Google w USA. Przechowuję je do 14 miesięcy. Bez zgody
			skrypt Google w ogóle się nie wczytuje.
		</p>

		<h2 class="section"><span>formularz kontaktowy</span></h2>
		<p>
			Imię, adres email i treść wiadomości trafiają do mnie mailem. Używam ich tylko do odpowiedzi i
			trzymam tak długo, jak trwa rozmowa.
		</p>

		<h2 class="section"><span>twoje prawa</span></h2>
		<p>
			Możesz poprosić o wgląd w swoje dane, ich poprawienie lub usunięcie, pisząc na
			<a href="mailto:hello@raqz.pl">hello@raqz.pl</a>. Możesz też złożyć skargę do Prezesa Urzędu
			Ochrony Danych Osobowych.
		</p>
	</div>
{:else}
	<div class="prose">
		<p>
			The data controller is Mariusz Rakus, contact: <a href="mailto:hello@raqz.pl">hello@raqz.pl</a>.
		</p>

		<h2 class="section"><span>page counter (Umami)</span></h2>
		<p>
			Umami always runs, on my own server. It sets no cookies. It records the pages you open, the site
			you came from, your browser, system, device type, screen size and country. On Android phones with
			Chrome, Samsung Internet or Edge it also records the phone model and system version. It also
			records how far you scroll, how long the page stays in front, which links leading off the site
			you click, and whether the contact form was sent (not what it said). Umami records the visit
			(mouse movement and clicks) for replay and heatmaps, with part of the content masked. The data
			goes to no one but me.
		</p>

		<h2 class="section"><span>Google Analytics</span></h2>
		<p>
			Only if you agree. Google Analytics 4 then sets the <span class="mono">_ga</span> and
			<span class="mono">_ga_*</span> cookies and collects data about the visit, including the device
			model and approximate location. The same data measures Google Ads results. Google Ireland Ltd
			processes it and it may reach Google servers in the USA. I keep it for up to 14 months. Without
			consent the Google script does not load at all.
		</p>

		<h2 class="section"><span>contact form</span></h2>
		<p>
			Your name, email address and message reach me by email. I use them only to answer and keep them
			for as long as the conversation lasts.
		</p>

		<h2 class="section"><span>your rights</span></h2>
		<p>
			You can ask to see, correct or delete your data by writing to
			<a href="mailto:hello@raqz.pl">hello@raqz.pl</a>. You can also complain to your data protection
			authority.
		</p>
	</div>
{/if}

<h2 class="section"><span>{strings.consent.label}</span></h2>
{#if consent.ready}
	<p class="choice">{strings.privacy.current(choice)}</p>
	<div class="actions">
		<button type="button" onclick={() => choose('denied')}>{strings.privacy.reject}</button>
		<button type="button" onclick={() => choose('granted')}>{strings.privacy.accept}</button>
	</div>
{/if}

<style>
	.prose p {
		margin-top: 16px;
		max-width: 62ch;
	}

	.choice {
		margin-top: 16px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 12px;
	}

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
</style>
