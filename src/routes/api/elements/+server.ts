import { json } from '@sveltejs/kit';
import { insertElement } from '../../../view_models/canvasViewModel.js';

export async function POST({ request }) {
	const body = (await request.json()) ?? {};

	const created = await insertElement({
		id: body.id,
		frameId: body.frameId,
		ancestorIds: body.ancestorIds ?? [],
		title: body.title,
		type: body.type,
		value: body.value
	});

	return json(created, { status: 201 });
}
