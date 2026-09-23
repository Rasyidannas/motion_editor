import { json } from '@sveltejs/kit';
import { updateElement, deleteElement } from '../../../../view_models/canvasViewModel.js';

export async function PATCH({ params, request }) {
	const body = (await request.json()) ?? {};

	if (!params.id) {
		return json({ error: 'Missing element id' }, { status: 400 });
	}

	/** @type {string | undefined} */
	let title;
	/** @type {string | undefined} */
	let type;
	/** @type {any} */
	let value;
	let hasValue = false;

	if (body.title !== undefined) {
		title = String(body.title).trim();
		if (!title) {
			return json({ error: 'Title must not be empty' }, { status: 400 });
		}
	}

	if (body.type !== undefined) {
		type = String(body.type).trim();
	}

	if (body.value !== undefined) {
		if (typeof body.value !== 'object' || body.value === null) {
			return json({ error: 'value must be an object' }, { status: 400 });
		}
		value = body.value;
		hasValue = true;
	}

	if (title === undefined && type === undefined && !hasValue) {
		return json({ error: 'Nothing to update' }, { status: 400 });
	}

	const updated = await updateElement(params.id, {
		...(title !== undefined ? { title } : {}),
		...(type !== undefined ? { type } : {}),
		...(hasValue ? { value } : {})
	});

	return json(updated);
}

export async function DELETE({ params }) {
	if (!params.id) {
		return json({ error: 'Missing element id' }, { status: 400 });
	}

	await deleteElement(params.id);
	return json({ ok: true });
}
