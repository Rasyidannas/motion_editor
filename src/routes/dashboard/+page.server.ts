import { readDashboard } from '../../view_models/dashboardViewModel.js';

export async function load() {
	return await readDashboard();
}
