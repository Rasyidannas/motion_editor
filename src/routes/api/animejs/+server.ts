import { json } from '@sveltejs/kit';
import { insertAnimejs, deleteAnimejsByElement } from '../../../view_models/canvasViewModel.js';

export async function POST({ request }) {
	const body = (await request.json()) ?? {};

	const created = await insertAnimejs({
		elementId: body.elementId,
		type: body.type,
		typeValue: body.typeValue ?? null,
		util: body.util ?? null,
		utilValue: body.utilValue ?? null
	});

	return json(created, { status: 201 });
}

export async function DELETE({ request }) {
	const body = (await request.json()) ?? {};

	if (!body.elementId) {
		return json({ error: 'elementId is required' }, { status: 400 });
	}

	return json(await deleteAnimejsByElement(String(body.elementId)));
}
