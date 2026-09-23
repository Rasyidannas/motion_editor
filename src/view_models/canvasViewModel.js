import { db } from '$lib/server/db';
import { frames, elements, treeElements, elementTypeValues } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function readCanvas(/** @type {string} */ frameId) {
	const found = await db.select().from(frames).where(eq(frames.id, frameId));

	if (found.length === 0) {
		throw error(404, 'Frame not found');
	}

	const frameElements = await db.select().from(elements).where(eq(elements.frameId, frameId));

	return {
		frame: found[0],
		elements: frameElements,
		elementTypes: [...elementTypeValues]
	};
}

export async function updateElementTitle(/** @type {string} */ elementId, /** @type {string} */ title) {
	const updated = await updateElement(elementId, { title });
	return updated;
}

/**
 * @param {string} elementId
 * @param {{ title?: string, type?: string }} patch
 */
export async function updateElement(elementId, patch) {
	/** @type {{ title?: string, type?: any, updatedAt: Date }} */
	const set = { updatedAt: new Date() };

	if (patch.title !== undefined) {
		set.title = patch.title;
	}

	if (patch.type !== undefined) {
		if (!/** @type {readonly string[]} */ (elementTypeValues).includes(patch.type)) {
			throw error(400, `Invalid type. Must be one of: ${elementTypeValues.join(', ')}`);
		}
		set.type = patch.type;
	}

	const updated = await db.update(elements).set(set).where(eq(elements.id, elementId)).returning();

	if (updated.length === 0) {
		throw error(404, 'Element not found');
	}

	return updated[0];
}

/**
 * Insert a new element at the end of a frame's order and link it in the
 * closure table: always a self row, plus one row per ancestor id so the
 * full ancestor chain (e.g. div -> h1) is recorded.
 * @param {{ frameId: string, ancestorIds?: Array<string> | null, title: string, type: string, value: any }} input
 */
export async function insertElement(input) {
	const frameId = String(input?.frameId ?? '');
	const title = String(input?.title ?? '').trim();
	const type = String(input?.type ?? '').trim();

	if (!frameId) {
		throw error(400, 'frameId is required');
	}
	if (!title) {
		throw error(400, 'Title must not be empty');
	}
	if (!/** @type {readonly string[]} */ (elementTypeValues).includes(type)) {
		throw error(400, `Invalid type. Must be one of: ${elementTypeValues.join(', ')}`);
	}
	if (typeof input?.value !== 'object' || input.value === null) {
		throw error(400, 'value must be an object');
	}

	const siblings = await db.select().from(elements).where(eq(elements.frameId, frameId));
	const nextOrder = siblings.reduce((/** @type {number} */ max, /** @type {any} */ row) => {
		const order = typeof row.order === 'number' ? row.order : -1;
		return order > max ? order : max;
	}, -1) + 1;

	const [created] = await db
		.insert(elements)
		.values({ title, type: /** @type {any} */ (type), value: input.value, order: nextOrder, frameId })
		.returning();

	await db.insert(treeElements).values({ ancestor: created.id, descendant: created.id });

	const ancestorIds = Array.isArray(input?.ancestorIds) ? [...new Set(input.ancestorIds)] : [];
	for (const ancestorId of ancestorIds) {
		if (!ancestorId || ancestorId === created.id) continue;
		await db.insert(treeElements).values({ ancestor: ancestorId, descendant: created.id });
	}

	return created;
}
