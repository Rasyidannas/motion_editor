import { db } from '$lib/server/db';
import { frames, elements, elementTypeValues } from '$lib/server/db/schema';
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
