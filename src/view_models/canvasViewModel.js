import { db } from '$lib/server/db';
import { frames, elements, treeElements, animejs, elementTypeValues, animejsTypeValues, utilityValues } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function readCanvas(/** @type {string} */ frameId) {
	const found = await db.select().from(frames).where(eq(frames.id, frameId));

	if (found.length === 0) {
		throw error(404, 'Frame not found');
	}

	const frameElements = await db.select().from(elements).where(eq(elements.frameId, frameId));
	const elementIds = frameElements.map((/** @type {any} */ row) => row.id);
	const frameAnime =
		elementIds.length > 0
			? await db.select().from(animejs).where(inArray(animejs.elementId, elementIds))
			: [];

	return {
		frame: found[0],
		elements: frameElements,
		animejs: frameAnime,
		elementTypes: [...elementTypeValues]
	};
}

export async function updateElementTitle(/** @type {string} */ elementId, /** @type {string} */ title) {
	const updated = await updateElement(elementId, { title });
	return updated;
}

/**
 * @param {string} elementId
 * @param {{ title?: string, type?: string, value?: any }} patch
 */
export async function updateElement(elementId, patch) {
	/** @type {{ title?: string, type?: any, value?: any, updatedAt: Date }} */
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

	if (patch.value !== undefined) {
		if (typeof patch.value !== 'object' || patch.value === null) {
			throw error(400, 'value must be an object');
		}
		set.value = patch.value;
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
 * Accepts an optional client-provided `id` (UUID) — when present the server
 * uses it instead of generating a new one, which keeps data-element-id
 * attributes in the stored markup consistent with the element record.
 * @param {{ id?: string | null, frameId: string, ancestorIds?: Array<string> | null, title: string, type: string, value: any }} input
 */
export async function insertElement(input) {
	const id = input?.id ? String(input.id).trim() : undefined;
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

	const base = { title, type: /** @type {any} */ (type), value: input.value, order: nextOrder, frameId };
	const values = id ? { ...base, id } : base;

	const [created] = await db.insert(elements).values(values).returning();

	await db.insert(treeElements).values({ ancestor: created.id, descendant: created.id });

	const ancestorIds = Array.isArray(input?.ancestorIds) ? [...new Set(input.ancestorIds)] : [];
	for (const ancestorId of ancestorIds) {
		if (!ancestorId || ancestorId === created.id) continue;
		await db.insert(treeElements).values({ ancestor: ancestorId, descendant: created.id });
	}

	return created;
}

/**
 * Insert an animejs record linked to an element. Scripts are stored here,
 * never in the elements table.
 * @param {{ elementId: string, type: string, typeValue?: any, util?: string | null, utilValue?: any }} input
 */
export async function insertAnimejs(input) {
	const elementId = String(input?.elementId ?? '');
	const type = String(input?.type ?? '').trim();

	if (!elementId) {
		throw error(400, 'elementId is required');
	}

	const found = await db.select().from(elements).where(eq(elements.id, elementId));
	if (found.length === 0) {
		throw error(404, 'Element not found');
	}

	if (!/** @type {readonly string[]} */ (animejsTypeValues).includes(type)) {
		throw error(400, `Invalid type. Must be one of: ${animejsTypeValues.join(', ')}`);
	}

	const util =
		input?.util === undefined || input.util === null || String(input.util).trim() === ''
			? null
			: String(input.util).trim();
	if (util !== null && !/** @type {readonly string[]} */ (utilityValues).includes(util)) {
		throw error(400, `Invalid util. Must be one of: ${utilityValues.join(', ')}`);
	}

	const typeValue = input?.typeValue ?? null;
	const utilValue = input?.utilValue ?? null;

	const [created] = await db
		.insert(animejs)
		.values({
			elementId,
			type: /** @type {any} */ (type),
			typeValue,
			util: /** @type {any} */ (util),
			utilValue
		})
		.returning();

	return created;
}

/**
 * Delete every animejs record linked to one element (used to re-sync the
 * script block from editor code).
 * @param {string} elementId
 */
export async function deleteAnimejsByElement(elementId) {
	if (!elementId) {
		throw error(400, 'elementId is required');
	}
	await db.delete(animejs).where(eq(animejs.elementId, elementId));
	return { ok: true };
}

/**
 * Delete one element and everything linked to it: its animejs records, its
 * closure-table rows (self + ancestors + descendants), and the record itself.
 * Children of a deleted parent are also removed by the cascade on the
 * elements.frameId… but descendants are linked via tree_elements, so we
 * explicitly delete all tree_elements rows referencing this element first.
 * @param {string} elementId
 */
export async function deleteElement(elementId) {
	if (!elementId) {
		throw error(400, 'elementId is required');
	}

	const found = await db.select().from(elements).where(eq(elements.id, elementId));
	if (found.length === 0) {
		throw error(404, 'Element not found');
	}

	// remove animejs records targeting this element
	await db.delete(animejs).where(eq(animejs.elementId, elementId));
	// remove closure rows where this element is ancestor or descendant
	await db.delete(treeElements).where(eq(treeElements.ancestor, elementId));
	await db.delete(treeElements).where(eq(treeElements.descendant, elementId));
	// finally the element record itself (descendant rows cascade)
	await db.delete(elements).where(eq(elements.id, elementId));

	return { ok: true };
}
