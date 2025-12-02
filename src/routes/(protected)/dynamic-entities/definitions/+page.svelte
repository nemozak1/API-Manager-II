<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Plus,
		MoreVertical,
		Search,
		Edit,
		Trash2,
		Eye,
		Database,
		ArrowLeft,
		Copy,
		AlertCircle,
		Code
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let searchQuery = '';
	let showCreateDialog = false;
	let showViewDialog = false;
	let showEditDialog = false;
	let selectedDefinition: any = null;

	// Form state
	let formName = '';
	let formDescription = '';
	let formSchema = '{\n  "field_name": {\n    "type": "string",\n    "required": true,\n    "description": "Field description"\n  }\n}';
	let formVersion = '1.0';
	let isSubmitting = false;
	let schemaError = '';

	$: filteredDefinitions = data.definitions.filter((def) => {
		const query = searchQuery.toLowerCase();
		return (
			query === '' ||
			def.name.toLowerCase().includes(query) ||
			(def.description && def.description.toLowerCase().includes(query)) ||
			def.id.toLowerCase().includes(query)
		);
	});

	$: totalEntities = data.definitions.reduce((sum, def) => sum + (def.entity_count || 0), 0);

	function validateSchema(schemaStr: string): boolean {
		try {
			const parsed = JSON.parse(schemaStr);
			if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
				schemaError = 'Schema must be a JSON object';
				return false;
			}
			schemaError = '';
			return true;
		} catch (err) {
			schemaError = 'Invalid JSON format';
			return false;
		}
	}

	function resetForm() {
		formName = '';
		formDescription = '';
		formSchema = '{\n  "field_name": {\n    "type": "string",\n    "required": true,\n    "description": "Field description"\n  }\n}';
		formVersion = '1.0';
		schemaError = '';
	}

	function openCreateDialog() {
		resetForm();
		showCreateDialog = true;
	}

	function openEditDialog(definition: any) {
		selectedDefinition = definition;
		formName = definition.name;
		formDescription = definition.description || '';
		formSchema = JSON.stringify(definition.schema, null, 2);
		formVersion = definition.version || '1.0';
		schemaError = '';
		showEditDialog = true;
	}

	function openViewDialog(definition: any) {
		selectedDefinition = definition;
		showViewDialog = true;
	}

	async function handleCreate() {
		if (!formName.trim()) {
			toast.error('Name is required');
			return;
		}

		if (!validateSchema(formSchema)) {
			toast.error('Please fix schema errors');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/dynamic-entity-definitions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formName,
					description: formDescription || null,
					schema: JSON.parse(formSchema),
					version: formVersion
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create definition');
			}

			toast.success('Definition created successfully');
			showCreateDialog = false;
			window.location.reload();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create definition');
			console.error('Create error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdate() {
		if (!selectedDefinition || !formName.trim()) {
			toast.error('Name is required');
			return;
		}

		if (!validateSchema(formSchema)) {
			toast.error('Please fix schema errors');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(`/api/dynamic-entity-definitions/${selectedDefinition.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formName,
					description: formDescription || null,
					schema: JSON.parse(formSchema),
					version: formVersion
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update definition');
			}

			toast.success('Definition updated successfully');
			showEditDialog = false;
			window.location.reload();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update definition');
			console.error('Update error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(definitionId: string, entityCount: number) {
		if (entityCount > 0) {
			if (
				!confirm(
					`This definition has ${entityCount} entities. Deleting it will also delete all associated entities. Are you sure?`
				)
			) {
				return;
			}
		} else {
			if (!confirm('Are you sure you want to delete this definition?')) {
				return;
			}
		}

		try {
			const response = await fetch(`/api/dynamic-entity-definitions/${definitionId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete definition');
			}

			toast.success('Definition deleted successfully');
			window.location.reload();
		} catch (error) {
			toast.error('Failed to delete definition');
			console.error('Delete error:', error);
		}
	}

	async function duplicateDefinition(definition: any) {
		selectedDefinition = definition;
		formName = `${definition.name} (Copy)`;
		formDescription = definition.description || '';
		formSchema = JSON.stringify(definition.schema, null, 2);
		formVersion = definition.version || '1.0';
		schemaError = '';
		showCreateDialog = true;
	}

	function getFieldCount(schema: any): number {
		return Object.keys(schema || {}).length;
	}

	function getRequiredFieldCount(schema: any): number {
		return Object.values(schema || {}).filter((field: any) => field.required).length;
	}
</script>

<svelte:head>
	<title>Entity Definitions - API Manager</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<Button variant="ghost" on:click={() => goto('/dynamic-entities')} class="mb-2 -ml-4">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Entities
			</Button>
			<h1 class="text-3xl font-bold tracking-tight">Entity Definitions</h1>
			<p class="text-muted-foreground mt-1">
				Manage dynamic entity type definitions and schemas
			</p>
		</div>
		<Button on:click={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" />
			Create Definition
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Definitions</CardTitle>
				<Database class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.definitions.length}</div>
				<p class="text-xs text-muted-foreground">Entity type definitions</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Entities</CardTitle>
				<Database class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{totalEntities}</div>
				<p class="text-xs text-muted-foreground">Across all definitions</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Filtered Results</CardTitle>
				<Search class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{filteredDefinitions.length}</div>
				<p class="text-xs text-muted-foreground">Matching search</p>
			</CardContent>
		</Card>
	</div>

	<!-- Search -->
	<Card>
		<CardHeader>
			<CardTitle>Search</CardTitle>
			<CardDescription>Find definitions by name or description</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="relative">
				<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search definitions..."
					class="pl-8"
					bind:value={searchQuery}
				/>
			</div>
		</CardContent>
	</Card>

	<!-- Definitions Table -->
	<Card>
		<CardHeader>
			<CardTitle>Definitions</CardTitle>
			<CardDescription>
				{filteredDefinitions.length}
				{filteredDefinitions.length === 1 ? 'definition' : 'definitions'} found
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if filteredDefinitions.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Database class="h-12 w-12 text-muted-foreground mb-4" />
					<h3 class="text-lg font-semibold mb-2">No definitions found</h3>
					<p class="text-muted-foreground mb-4">
						{data.definitions.length === 0
							? 'Get started by creating your first entity definition'
							: 'Try adjusting your search criteria'}
					</p>
					{#if data.definitions.length === 0}
						<Button on:click={openCreateDialog}>
							<Plus class="mr-2 h-4 w-4" />
							Create First Definition
						</Button>
					{/if}
				</div>
			{:else}
				<div class="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Fields</TableHead>
								<TableHead>Entities</TableHead>
								<TableHead>Version</TableHead>
								<TableHead>Created</TableHead>
								<TableHead class="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredDefinitions as definition}
								<TableRow>
									<TableCell class="font-medium">{definition.name}</TableCell>
									<TableCell class="max-w-md truncate text-muted-foreground text-sm">
										{definition.description || 'No description'}
									</TableCell>
									<TableCell>
										<div class="flex gap-2">
											<Badge variant="secondary">
												{getFieldCount(definition.schema)} total
											</Badge>
											{#if getRequiredFieldCount(definition.schema) > 0}
												<Badge variant="outline">
													{getRequiredFieldCount(definition.schema)} required
												</Badge>
											{/if}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={definition.entity_count > 0 ? 'default' : 'secondary'}>
											{definition.entity_count || 0}
										</Badge>
									</TableCell>
									<TableCell class="text-sm">
										{definition.version || '1.0'}
									</TableCell>
									<TableCell class="text-sm">
										{new Date(definition.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell class="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild let:builder>
												<Button builders={[builder]} variant="ghost" size="icon">
													<MoreVertical class="h-4 w-4" />
													<span class="sr-only">Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem on:click={() => openViewDialog(definition)}>
													<Eye class="mr-2 h-4 w-4" />
													View Schema
												</DropdownMenuItem>
												<DropdownMenuItem on:click={() => openEditDialog(definition)}>
													<Edit class="mr-2 h-4 w-4" />
													Edit Definition
												</DropdownMenuItem>
												<DropdownMenuItem on:click={() => duplicateDefinition(definition)}>
													<Copy class="mr-2 h-4 w-4" />
													Duplicate
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													class="text-destructive"
													on:click={() => handleDelete(definition.id, definition.entity_count)}
												>
													<Trash2 class="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Create Definition Dialog -->
<Dialog bind:open={showCreateDialog}>
	<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Create Entity Definition</DialogTitle>
			<DialogDescription>
				Define a new entity type with its schema and validation rules
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="create-name">Name *</Label>
				<Input
					id="create-name"
					placeholder="e.g., Product, Customer, Order"
					bind:value={formName}
				/>
			</div>
			<div class="space-y-2">
				<Label for="create-description">Description</Label>
				<Textarea
					id="create-description"
					placeholder="Describe what this entity type represents..."
					rows={2}
					bind:value={formDescription}
				/>
			</div>
			<div class="space-y-2">
				<Label for="create-version">Version</Label>
				<Input id="create-version" placeholder="e.g., 1.0" bind:value={formVersion} />
			</div>
			<div class="space-y-2">
				<Label for="create-schema">Schema (JSON) *</Label>
				<Textarea
					id="create-schema"
					placeholder="Enter JSON schema..."
					rows={12}
					class="font-mono text-sm"
					bind:value={formSchema}
					on:input={() => validateSchema(formSchema)}
				/>
				{#if schemaError}
					<p class="text-sm text-destructive flex items-center gap-1">
						<AlertCircle class="h-3 w-3" />
						{schemaError}
					</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					Define fields with properties like type, required, description, etc.
				</p>
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" on:click={() => (showCreateDialog = false)}>Cancel</Button>
			<Button on:click={handleCreate} disabled={isSubmitting}>
				{isSubmitting ? 'Creating...' : 'Create Definition'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Edit Definition Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Edit Entity Definition</DialogTitle>
			<DialogDescription>Update the definition schema and properties</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="edit-name">Name *</Label>
				<Input id="edit-name" placeholder="Definition name" bind:value={formName} />
			</div>
			<div class="space-y-2">
				<Label for="edit-description">Description</Label>
				<Textarea
					id="edit-description"
					placeholder="Describe what this entity type represents..."
					rows={2}
					bind:value={formDescription}
				/>
			</div>
			<div class="space-y-2">
				<Label for="edit-version">Version</Label>
				<Input id="edit-version" placeholder="e.g., 1.0" bind:value={formVersion} />
			</div>
			<div class="space-y-2">
				<Label for="edit-schema">Schema (JSON) *</Label>
				<Textarea
					id="edit-schema"
					placeholder="Enter JSON schema..."
					rows={12}
					class="font-mono text-sm"
					bind:value={formSchema}
					on:input={() => validateSchema(formSchema)}
				/>
				{#if schemaError}
					<p class="text-sm text-destructive flex items-center gap-1">
						<AlertCircle class="h-3 w-3" />
						{schemaError}
					</p>
				{/if}
			</div>
			{#if selectedDefinition?.entity_count > 0}
				<div class="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
					<p class="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
						<AlertCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
						<span>
							Warning: This definition has {selectedDefinition.entity_count} existing entities.
							Changing the schema may affect data validation for existing entities.
						</span>
					</p>
				</div>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" on:click={() => (showEditDialog = false)}>Cancel</Button>
			<Button on:click={handleUpdate} disabled={isSubmitting}>
				{isSubmitting ? 'Updating...' : 'Update Definition'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- View Schema Dialog -->
<Dialog bind:open={showViewDialog}>
	<DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>{selectedDefinition?.name || 'Entity Definition'}</DialogTitle>
			<DialogDescription>
				{selectedDefinition?.description || 'No description provided'}
			</DialogDescription>
		</DialogHeader>
		{#if selectedDefinition}
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label class="text-muted-foreground">Version</Label>
						<p class="font-medium">{selectedDefinition.version || '1.0'}</p>
					</div>
					<div>
						<Label class="text-muted-foreground">Entities</Label>
						<p class="font-medium">{selectedDefinition.entity_count || 0}</p>
					</div>
					<div>
						<Label class="text-muted-foreground">Created</Label>
						<p class="font-medium">
							{new Date(selectedDefinition.created_at).toLocaleString()}
						</p>
					</div>
					<div>
						<Label class="text-muted-foreground">Updated</Label>
						<p class="font-medium">
							{new Date(selectedDefinition.updated_at).toLocaleString()}
						</p>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label>Schema</Label>
						<Button
							variant="ghost"
							size="sm"
							on:click={() => {
								navigator.clipboard.writeText(JSON.stringify(selectedDefinition.schema, null, 2));
								toast.success('Schema copied to clipboard');
							}}
						>
							<Copy class="h-4 w-4 mr-2" />
							Copy
						</Button>
					</div>
					<div class="bg-muted rounded-lg p-4 overflow-x-auto">
						<pre class="text-sm font-mono">{JSON.stringify(
								selectedDefinition.schema,
								null,
								2
							)}</pre>
					</div>
				</div>

				<div class="space-y-2">
					<Label>Fields Summary</Label>
					<div class="space-y-2">
						{#each Object.entries(selectedDefinition.schema) as [fieldName, fieldDef]}
							{@const field = fieldDef as any}
							<div class="border rounded-lg p-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<p class="font-medium">{fieldName}</p>
											{#if field.required}
												<Badge variant="destructive" class="text-xs">Required</Badge>
											{/if}
											<Badge variant="outline" class="text-xs">{field.type}</Badge>
										</div>
										{#if field.description}
											<p class="text-sm text-muted-foreground mt-1">{field.description}</p>
										{/if}
									</div>
								</div>
								{#if field.enum}
									<div class="mt-2">
										<p class="text-xs text-muted-foreground">
											Allowed values: {field.enum.join(', ')}
										</p>
									</div>
								{/if}
								{#if field.minimum !== undefined || field.maximum !== undefined}
									<div class="mt-2">
										<p class="text-xs text-muted-foreground">
											Range: {field.minimum ?? '∞'} to {field.maximum ?? '∞'}
										</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
		<DialogFooter>
			<Button variant="outline" on:click={() => (showViewDialog = false)}>Close</Button>
			<Button on:click={() => openEditDialog(selectedDefinition)}>
				<Edit class="mr-2 h-4 w-4" />
				Edit Definition
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
