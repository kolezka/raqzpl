import { fail } from '@sveltejs/kit';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

// Loose on purpose: the address only has to be routable, the mail server decides.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One transport per process, built on first send. A missing setting then fails the
// request instead of the server start, so the rest of the site stays up.
let transport: Transporter | undefined;

function getTransport(): Transporter {
	if (transport) return transport;

	const host = env.SMTP_HOST;
	if (!host) throw new Error('SMTP_HOST is not set');

	const port = Number(env.SMTP_PORT ?? 587);
	transport = nodemailer.createTransport({
		host,
		port,
		// Port 465 is TLS from the first byte, 587 upgrades with STARTTLS.
		secure: port === 465,
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
	});

	return transport;
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();

		// Hidden field. A human leaves it empty, most bots fill every input.
		if (String(data.get('company') ?? '')) {
			return { success: true };
		}

		const values = { name, email, message };

		if (!name || name.length > MAX_NAME) {
			return fail(400, { error: 'Give a name, 120 characters at most.', values });
		}
		if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL) {
			return fail(400, { error: 'Give an email address I can answer.', values });
		}
		if (!message || message.length > MAX_MESSAGE) {
			return fail(400, { error: 'Write a message, 5000 characters at most.', values });
		}

		const to = env.CONTACT_TO ?? 'hello@raqz.pl';

		try {
			await getTransport().sendMail({
				// The envelope sender stays mine, so SPF and DKIM hold. The visitor
				// address goes into Reply-To, where a reply needs it.
				from: env.SMTP_FROM ?? to,
				to,
				replyTo: { name, address: email },
				subject: `raqz.pl contact — ${name}`,
				text: `From: ${name} <${email}>\n\n${message}\n`
			});
		} catch (error) {
			console.error('contact form: send failed', error);
			return fail(502, { error: 'The mail server refused the message. Try again later.', values });
		}

		return { success: true };
	}
} satisfies Actions;
