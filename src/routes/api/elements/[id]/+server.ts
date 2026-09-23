import { json } from '@sveltejs/kit';
import { updateElement } from '../../../../view_models/canvasViewModel.js';

export async function PATCH({ params, request }) {
	const body = (await request.json()) ?? {};

	if (!params.id) {
		return json({ error: 'Missing element id' }, { status: 400 });
	}

	/** @type {string | undefined} */
	let title;
	/** @type {string | undefined} */
	let type;

	if (body.title !== undefined) {
		title = String(body.title).trim();
		if (!title) {
			return json({ error: 'Title must not be empty' }, { status: 400 });
		}
	}

	if (body.type !== undefined) {
		type = String(body.type).trim();
	}

	if (title === undefined && type === undefined) {
		return json({ error: 'Nothing to update' }, { status: 400 });
	}

	const updated = await updateElement(params.id, {
		...(title !== undefined ? { title } : {}),
		...(type !== undefined ? { type } : {})
	});

	return json(updated);
}
