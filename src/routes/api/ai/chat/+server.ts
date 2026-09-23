import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/** Strip markdown code fences so pasted/fenced replies still apply cleanly. */
const stripFences = (text: string): string => {
	const match = /```(?:\w+)?\s*([\s\S]*?)```/.exec(text ?? '');
	return (match ? match[1] : (text ?? '')).trim();
};

export async function POST({ request }) {
	const body = (await request.json()) ?? {};
	const message = String(body.message ?? '').trim();
	const code = String(body.code ?? '');

	if (!message) {
		return json({ error: 'Message is required' }, { status: 400 });
	}

	const apiKey = env.AI_API_KEY;
	if (!apiKey) {
		return json(
			{ error: 'AI_API_KEY is not set. Add it to .env — see README.' },
			{ status: 500 }
		);
	}

	const model = env.AI_MODEL || 'gpt-4o-mini';
	const base = (env.AI_API_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

	const system = [
		'You are an expert front-end developer editing a single SVG/HTML snippet in a live code editor.',
		'The user describes a change; you return the COMPLETE updated code and nothing else.',
		'Rules:',
		'- Return only raw code, no markdown fences, no explanations, no commentary.',
		'- Keep the root tag and its data-element-title, data-element-type and data-element-id attributes unless the user explicitly asks to change them.',
		'- Keep the code valid and self-contained.'
	].join('\n');

	let res;
	try {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		};
		// Recommended by OpenRouter for app identification/rankings; harmless elsewhere.
		if (env.AI_SITE_URL) headers['HTTP-Referer'] = env.AI_SITE_URL;
		if (env.AI_SITE_NAME) headers['X-Title'] = env.AI_SITE_NAME;
		res = await fetch(`${base}/chat/completions`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model,
				temperature: 0.2,
				messages: [
					{ role: 'system', content: system },
					{
						role: 'user',
						content: `Element title: ${body.title ?? ''}\nElement type: ${body.type ?? ''}\n\nCurrent code:\n${code}\n\nRequest: ${message}`
					}
				]
			})
		});
	} catch {
		return json({ error: 'Could not reach the AI API. Check AI_API_URL.' }, { status: 502 });
	}

	if (!res.ok) {
		const errBody = await res.json().catch(() => ({}));
		const detail =
			errBody?.error?.message ?? errBody?.error ?? `AI API responded with status ${res.status}`;
		return json({ error: String(detail) }, { status: 502 });
	}

	const data = await res.json();
	const reply = data?.choices?.[0]?.message?.content ?? '';
	const clean = stripFences(reply);

	if (!clean) {
		return json({ error: 'The AI returned an empty response.' }, { status: 502 });
	}

	return json({ code: clean, note: 'Code updated by AI.' });
}
