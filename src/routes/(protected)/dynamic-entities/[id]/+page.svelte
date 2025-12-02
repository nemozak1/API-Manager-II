<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		ArrowLeft,
		Edit,
		Trash2,
		MoreVertical,
		Copy,
		Calendar,
		Database,
		Code,
		CheckCircle2,
		XCircle
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	$: entity = data.entity;
	$: definition = data.definition;
	$: schema = definition.schema || {};

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/dynamic-entities/${entity.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete entity');
			}

			toast.success('Entity deleted successfully');
			goto('/dynamic-entities');
		} catch (error) {
			toast.error('Failed to delete entity');
			console.error('Delete error:', error);
		}
	}

	function copyEntityId() {
		navigator.clipboard.writeText(entity.id);
		toast.success('Entity ID copied to clipboard');
	}

	function copyEntityData() {
		navigator.clipboard.writeText(JSON.stringify(entity.data, null, 2));
		toast.success('Entity data copied to clipboard');
	}

	function formatValue(value: any, fieldDef: any): string {
		if (value === null || value === undefined) {
			return 'Not set';
		}

		if (fieldDef?.type === 'boolean') {
			return value ? 'Yes' : 'No';
		}

		if (fieldDef?.type === 'array' || fieldDef?.type === 'object') {
			return JSON.stringify(value, null, 2);
		}

		if (fieldDef?.format === 'date' || fieldDef?.format === 'datetime') {
			try {
				return new Date(value).toLocaleString();
			} catch {
				return String(value);
			}
		}

		if (fieldDef?.format === 'url') {
			return value;
		}

		return String(value);
	}

	function isComplexType(fieldDef: any): boolean {
		return fieldDef?.type === 'array' || fieldDef?.type === 'object';
	}

	function getFieldIcon(fieldDef: any) {
		if (fieldDef?.type === 'boolean') {
			return fieldDef?.value ? CheckCircle2 : XCircle;
		}
		return null;
	}
</script>

<svelte:head>
	<title>Entity {entity.id} - API Manager</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-5xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<Button variant="ghost" on:click={() => goto('/dynamic-entities')} class="mb-2 -ml-4">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Entities
			</Button>
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold tracking-tight">Entity Details</h1>
				<Badge variant="secondary">{definition.name}</Badge>
			</div>
			<p class="text-muted-foreground mt-1">View entity information and data</p>
		</div>
		<DropdownMenu>
			<DropdownMenuTrigger asChild let:builder>
				<Button builders={[builder]} variant="outline">
					<MoreVertical class="mr-2 h-4 w-4" />
					Actions
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem on:click={() => goto(`/dynamic-entities/${entity.id}/edit`)}>
					<Edit class="mr-2 h-4 w-4" />
					Edit Entity
				</DropdownMenuItem>
				<DropdownMenuItem on:click={copyEntityId}>
					<Copy class="mr-2 h-4 w-4" />
					Copy Entity ID
				</DropdownMenuItem>
				<DropdownMenuItem on:click={copyEntityData}>
					<Code class="mr-2 h-4 w-4" />
					Copy Entity Data
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem class="text-destructive" on:click={handleDelete}>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete Entity
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>

	<!-- Entity Metadata -->
	<Card>
		<CardHeader>
			<CardTitle>Entity Information</CardTitle>
			<CardDescription>Basic metadata about this entity</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1">
					<p class="text-sm font-medium text-muted-foreground">Entity ID</p>
					<div class="flex items-center gap-2">
						<code class="text-sm bg-muted px-2 py-1 rounded">{entity.id}</code>
						<Button variant="ghost" size="icon" class="h-6 w-6" on:click={copyEntityId}>
							<Copy class="h-3 w-3" />
						</Button>
					</div>
				</div>
				<div class="space-y-1">
					<p class="text-sm font-medium text-muted-foreground">Entity Type</p>
					<div class="flex items-center gap-2">
						<Badge variant="secondary" class="text-sm">
							<Database class="mr-1 h-3 w-3" />
							{definition.name}
						</Badge>
						{#if definition.version}
							<Badge variant="outline" class="text-xs">v{definition.version}</Badge>
						{/if}
					</div>
				</div>
				<div class="space-y-1">
					<p class="text-sm font-medium text-muted-foreground">Created</p>
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4 text-muted-foreground" />
						<p class="text-sm">{new Date(entity.created_at).toLocaleString()}</p>
					</div>
				</div>
				<div class="space-y-1">
					<p class="text-sm font-medium text-muted-foreground">Last Updated</p>
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4 text-muted-foreground" />
						<p class="text-sm">{new Date(entity.updated_at).toLocaleString()}</p>
					</div>
				</div>
			</div>
			{#if definition.description}
				<div class="mt-4 pt-4 border-t">
					<p class="text-sm font-medium text-muted-foreground mb-1">Definition Description</p>
					<p class="text-sm">{definition.description}</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Entity Data -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Entity Data</CardTitle>
					<CardDescription>Field values based on the {definition.name} schema</CardDescription>
				</div>
				<Button variant="outline" size="sm" on:click={() => goto(`/dynamic-entities/${entity.id}/edit`)}>
					<Edit class="mr-2 h-4 w-4" />
					Edit Data
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if Object.keys(schema).length === 0}
				<div class="text-center py-8">
					<p class="text-muted-foreground">No schema defined for this entity type</p>
				</div>
			{:else}
				<div class="space-y-6">
					{#each Object.entries(schema) as [fieldName, fieldDef]}
						{@const fieldValue = entity.data[fieldName]}
						{@const typedFieldDef = fieldDef}
						<div class="space-y-2">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<p class="font-medium">{typedFieldDef.title || fieldName}</p>
										{#if typedFieldDef.required}
											<Badge variant="destructive" class="text-xs px-1.5 py-0">Required</Badge>
										{/if}
										<Badge variant="outline" class="text-xs px-1.5 py-0">{typedFieldDef.type}</Badge>
									</div>
									{#if typedFieldDef.description}
										<p class="text-sm text-muted-foreground">{typedFieldDef.description}</p>
									{/if}
								</div>
							</div>

							<div class="pl-0">
								{#if fieldValue === null || fieldValue === undefined}
									<p class="text-sm text-muted-foreground italic">Not set</p>
								{:else if typedFieldDef.type === 'boolean'}
									<div class="flex items-center gap-2">
										{#if fieldValue}
											<CheckCircle2 class="h-5 w-5 text-green-600" />
											<span class="text-sm font-medium">Yes</span>
										{:else}
											<XCircle class="h-5 w-5 text-red-600" />
											<span class="text-sm font-medium">No</span>
										{/if}
									</div>
								{:else if isComplexType(typedFieldDef)}
									<div class="bg-muted rounded-lg p-3 overflow-x-auto">
										<pre class="text-sm font-mono">{formatValue(fieldValue, typedFieldDef)}</pre>
									</div>
								{:else if typedFieldDef.format === 'url'}
									<a
										href={fieldValue}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm text-primary hover:underline"
									>
										{fieldValue}
									</a>
								{:else if typedFieldDef.format === 'email'}
									<a href="mailto:{fieldValue}" class="text-sm text-primary hover:underline">
										{fieldValue}
									</a>
								{:else}
									<p class="text-sm bg-muted px-3 py-2 rounded">
										{formatValue(fieldValue, typedFieldDef)}
									</p>
								{/if}
							</div>
						</div>

						{#if Object.entries(schema).indexOf([fieldName, fieldDef]) < Object.entries(schema).length - 1}
							<div class="border-t"></div>
						{/if}
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Raw JSON View -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Raw Data (JSON)</CardTitle>
					<CardDescription>Complete entity data in JSON format</CardDescription>
				</div>
				<Button variant="outline" size="sm" on:click={copyEntityData}>
					<Copy class="mr-2 h-4 w-4" />
					Copy JSON
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<div class="bg-muted rounded-lg p-4 overflow-x-auto">
				<pre class="text-sm font-mono">{JSON.stringify(entity.data, null, 2)}</pre>
			</div>
		</CardContent>
	</Card>
</div>
