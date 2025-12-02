import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const supabase = locals.supabase;

	try {
		// Fetch all dynamic entity definitions with entity counts
		const { data: definitions, error: definitionsError } = await supabase
			.from('dynamic_entity_definitions')
			.select('*')
			.order('created_at', { ascending: false });

		if (definitionsError) {
			console.error('Error fetching definitions:', definitionsError);
			throw error(500, 'Failed to load entity definitions');
		}

		// Fetch entity counts for each definition
		const { data: entities, error: entitiesError } = await supabase
			.from('dynamic_entities')
			.select('definition_id');

		if (entitiesError) {
			console.error('Error fetching entities:', entitiesError);
		}

		// Count entities per definition
		const entityCounts: Record<string, number> = {};
		if (entities) {
			entities.forEach((entity) => {
				entityCounts[entity.definition_id] = (entityCounts[entity.definition_id] || 0) + 1;
			});
		}

		// Add entity count to each definition
		const definitionsWithCounts = (definitions || []).map((def) => ({
			...def,
			entity_count: entityCounts[def.id] || 0
		}));

		return {
			definitions: definitionsWithCounts
		};
	} catch (err) {
		console.error('Load error:', err);
		throw error(500, 'Failed to load page data');
	}
};
