import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const supabase = locals.supabase;

	try {
		// Fetch all dynamic entity definitions
		const { data: definitions, error: definitionsError } = await supabase
			.from('dynamic_entity_definitions')
			.select('*')
			.order('name');

		if (definitionsError) {
			console.error('Error fetching definitions:', definitionsError);
			throw error(500, 'Failed to load entity definitions');
		}

		return {
			definitions: definitions || []
		};
	} catch (err) {
		console.error('Load error:', err);
		throw error(500, 'Failed to load page data');
	}
};
