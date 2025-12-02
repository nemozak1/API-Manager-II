<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
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
	import { Plus, MoreVertical, Search, Edit, Trash2, Eye, Database } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let searchQuery = '';
	let selectedDefinition = 'all';

	$: filteredEntities = data.entities.filter((entity) => {
		const matchesSearch =
			searchQuery === '' ||
			entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entity.definition_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			JSON.stringify(entity.data).toLowerCase().includes(searchQuery.toLowerCase());

		const matchesDefinition =
			selectedDefinition === 'all' || entity.definition_id === selectedDefinition;

		return matchesSearch && matchesDefinition;
	});

	$: definitionOptions = ['all', ...new Set(data.entities.map((e) => e.definition_id))];

	async function deleteEntity(entityId: string) {
		if (!confirm('Are you sure you want to delete this dynamic entity?')) {
			return;
		}

		try {
			const response = await fetch(`/api/dynamic-entities/${entityId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete entity');
			}

			toast.success('Dynamic entity deleted successfully');
			// Reload the page to refresh the data
			window.location.reload();
		} catch (error) {
			toast.error('Failed to delete dynamic entity');
			console.error('Delete error:', error);
		}
	}

	function viewEntity(entityId: string) {
		goto(`/dynamic-entities/${entityId}`);
	}

	function editEntity(entityId: string) {
		goto(`/dynamic-entities/${entityId}/edit`);
	}

	function getDefinitionName(definitionId: string): string {
		const definition = data.definitions.find((d) => d.id === definitionId);
		return definition?.name || definitionId;
	}

	function getFieldPreview(entityData: Record<string, any>): string {
		const keys = Object.keys(entityData).slice(0, 3);
		if (keys.length === 0) return 'No data';
		const preview = keys.map((key) => `${key}: ${entityData[key]}`).join(', ');
		return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
	}
</script>

<svelte:head>
	<title>Dynamic Entities - API Manager</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dynamic Entities</h1>
			<p class="text-muted-foreground mt-1">
				Manage dynamic data entities based on custom definitions
			</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" on:click={() => goto('/dynamic-entities/definitions')}>
				<Database class="mr-2 h-4 w-4" />
				Manage Definitions
			</Button>
			<Button on:click={() => goto('/dynamic-entities/create')}>
				<Plus class="mr-2 h-4 w-4" />
				Create Entity
			</Button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Entities</CardTitle>
				<Database class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.entities.length}</div>
				<p class="text-xs text-muted-foreground">Across all definitions</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Active Definitions</CardTitle>
				<Database class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.definitions.length}</div>
				<p class="text-xs text-muted-foreground">Entity type definitions</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Filtered Results</CardTitle>
				<Search class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{filteredEntities.length}</div>
				<p class="text-xs text-muted-foreground">Matching current filters</p>
			</CardContent>
		</Card>
	</div>

	<!-- Filters and Search -->
	<Card>
		<CardHeader>
			<CardTitle>Filters</CardTitle>
			<CardDescription>Search and filter dynamic entities</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search entities by ID or data..."
							class="pl-8"
							bind:value={searchQuery}
						/>
					</div>
				</div>
				<div class="w-64">
					<select
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						bind:value={selectedDefinition}
					>
						{#each definitionOptions as option}
							<option value={option}>
								{option === 'all' ? 'All Definitions' : getDefinitionName(option)}
							</option>
						{/each}
					</select>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Entities Table -->
	<Card>
		<CardHeader>
			<CardTitle>Entities</CardTitle>
			<CardDescription>
				{filteredEntities.length}
				{filteredEntities.length === 1 ? 'entity' : 'entities'} found
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if filteredEntities.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Database class="h-12 w-12 text-muted-foreground mb-4" />
					<h3 class="text-lg font-semibold mb-2">No entities found</h3>
					<p class="text-muted-foreground mb-4">
						{data.entities.length === 0
							? 'Get started by creating your first dynamic entity'
							: 'Try adjusting your search or filter criteria'}
					</p>
					{#if data.entities.length === 0}
						<Button on:click={() => goto('/dynamic-entities/create')}>
							<Plus class="mr-2 h-4 w-4" />
							Create First Entity
						</Button>
					{/if}
				</div>
			{:else}
				<div class="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Entity ID</TableHead>
								<TableHead>Definition</TableHead>
								<TableHead>Data Preview</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Updated</TableHead>
								<TableHead class="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredEntities as entity}
								<TableRow>
									<TableCell class="font-mono text-sm">{entity.id}</TableCell>
									<TableCell>
										<Badge variant="secondary">{getDefinitionName(entity.definition_id)}</Badge>
									</TableCell>
									<TableCell class="max-w-md truncate text-muted-foreground text-sm">
										{getFieldPreview(entity.data)}
									</TableCell>
									<TableCell class="text-sm">
										{new Date(entity.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell class="text-sm">
										{new Date(entity.updated_at).toLocaleDateString()}
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
												<DropdownMenuItem on:click={() => viewEntity(entity.id)}>
													<Eye class="mr-2 h-4 w-4" />
													View Details
												</DropdownMenuItem>
												<DropdownMenuItem on:click={() => editEntity(entity.id)}>
													<Edit class="mr-2 h-4 w-4" />
													Edit Entity
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													class="text-destructive"
													on:click={() => deleteEntity(entity.id)}
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

<style>
	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.5rem;
	}
</style>
