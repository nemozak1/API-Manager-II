import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;
	const entityId = params.id;

	try {
		// Fetch the dynamic entity
		const { data: entity, error: entityError } = await supabase
			.from('dynamic_entities')
			.select('*')
			.eq('id', entityId)
			.single();

		if (entityError || !entity) {
			console.error('Error fetching entity:', entityError);
			throw error(404, 'Entity not found');
		}

		// Fetch the entity's definition
		const { data: definition, error: definitionError } = await supabase
			.from('dynamic_entity_definitions')
			.select('*')
			.eq('id', entity.definition_id)
			.single();

		if (definitionError || !definition) {
			console.error('Error fetching definition:', definitionError);
			throw error(500, 'Failed to load entity definition');
		}

		return {
			entity,
			definition
		};
	} catch (err) {
		console.error('Load error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load entity data');
	}
};
