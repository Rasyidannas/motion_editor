import { readCanvas } from '../../../view_models/canvasViewModel.js';

export async function load({ params }) {
	return await readCanvas(params.frameId);
}
