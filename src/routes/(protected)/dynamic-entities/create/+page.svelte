<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let selectedDefinitionId = '';
	let entityData: Record<string, any> = {};
	let isSubmitting = false;
	let validationErrors: Record<string, string> = {};

	$: selectedDefinition = data.definitions.find((d) => d.id === selectedDefinitionId);
	$: schema = selectedDefinition?.schema || {};
	$: schemaFields = Object.entries(schema);

	function initializeEntityData() {
		if (!selectedDefinition) return;

		entityData = {};
		Object.entries(schema).forEach(([fieldName, fieldDef]: [string, any]) => {
			if (fieldDef.default !== undefined) {
				entityData[fieldName] = fieldDef.default;
			} else if (fieldDef.type === 'string') {
				entityData[fieldName] = '';
			} else if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
				entityData[fieldName] = 0;
			} else if (fieldDef.type === 'boolean') {
				entityData[fieldName] = false;
			} else if (fieldDef.type === 'array') {
				entityData[fieldName] = [];
			} else if (fieldDef.type === 'object') {
				entityData[fieldName] = {};
			} else {
				entityData[fieldName] = null;
			}
		});
	}

	$: if (selectedDefinitionId) {
		initializeEntityData();
	}

	function validateField(fieldName: string, fieldDef: any, value: any): string | null {
		// Required validation
		if (fieldDef.required && (value === null || value === undefined || value === '')) {
			return 'This field is required';
		}

		// Type validation
		if (value !== null && value !== undefined && value !== '') {
			if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
				const num = Number(value);
				if (isNaN(num)) {
					return 'Must be a valid number';
				}
				if (fieldDef.type === 'integer' && !Number.isInteger(num)) {
					return 'Must be an integer';
				}
				if (fieldDef.minimum !== undefined && num < fieldDef.minimum) {
					return `Must be at least ${fieldDef.minimum}`;
				}
				if (fieldDef.maximum !== undefined && num > fieldDef.maximum) {
					return `Must be at most ${fieldDef.maximum}`;
				}
			}

			if (fieldDef.type === 'string') {
				const str = String(value);
				if (fieldDef.minLength !== undefined && str.length < fieldDef.minLength) {
					return `Must be at least ${fieldDef.minLength} characters`;
				}
				if (fieldDef.maxLength !== undefined && str.length > fieldDef.maxLength) {
					return `Must be at most ${fieldDef.maxLength} characters`;
				}
				if (fieldDef.pattern) {
					const regex = new RegExp(fieldDef.pattern);
					if (!regex.test(str)) {
						return 'Invalid format';
					}
				}
			}

			if (fieldDef.enum && !fieldDef.enum.includes(value)) {
				return `Must be one of: ${fieldDef.enum.join(', ')}`;
			}
		}

		return null;
	}

	function validateAllFields(): boolean {
		validationErrors = {};
		let isValid = true;

		Object.entries(schema).forEach(([fieldName, fieldDef]: [string, any]) => {
			const error = validateField(fieldName, fieldDef, entityData[fieldName]);
			if (error) {
				validationErrors[fieldName] = error;
				isValid = false;
			}
		});

		return isValid;
	}

	async function handleSubmit() {
		if (!selectedDefinitionId) {
			toast.error('Please select an entity definition');
			return;
		}

		if (!validateAllFields()) {
			toast.error('Please fix validation errors before submitting');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/dynamic-entities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					definition_id: selectedDefinitionId,
					data: entityData
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create entity');
			}

			const result = await response.json();
			toast.success('Dynamic entity created successfully');
			goto(`/dynamic-entities/${result.id}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create entity');
			console.error('Submit error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleFieldChange(fieldName: string, fieldDef: any) {
		// Clear validation error when field changes
		if (validationErrors[fieldName]) {
			validationErrors = { ...validationErrors };
			delete validationErrors[fieldName];
		}
	}

	function renderFieldInput(fieldName: string, fieldDef: any) {
		const fieldType = fieldDef.type;
		const fieldValue = entityData[fieldName];

		if (fieldDef.enum && Array.isArray(fieldDef.enum)) {
			return 'enum-select';
		}

		switch (fieldType) {
			case 'string':
				if (fieldDef.format === 'textarea' || (fieldDef.maxLength && fieldDef.maxLength > 200)) {
					return 'textarea';
				}
				return 'text';
			case 'number':
			case 'integer':
				return 'number';
			case 'boolean':
				return 'checkbox';
			case 'array':
			case 'object':
				return 'json';
			default:
				return 'text';
		}
	}

	function getFieldInputType(fieldDef: any): string {
		if (fieldDef.format === 'email') return 'email';
		if (fieldDef.format === 'url') return 'url';
		if (fieldDef.format === 'date') return 'date';
		if (fieldDef.format === 'datetime') return 'datetime-local';
		if (fieldDef.type === 'number' || fieldDef.type === 'integer') return 'number';
		return 'text';
	}
</script>

<svelte:head>
	<title>Create Dynamic Entity - API Manager</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<Button variant="ghost" on:click={() => goto('/dynamic-entities')} class="mb-2 -ml-4">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Entities
			</Button>
			<h1 class="text-3xl font-bold tracking-tight">Create Dynamic Entity</h1>
			<p class="text-muted-foreground mt-1">Create a new entity based on a definition</p>
		</div>
	</div>

	<!-- Definition Selection -->
	<Card>
		<CardHeader>
			<CardTitle>Select Entity Definition</CardTitle>
			<CardDescription>Choose the type of entity you want to create</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if data.definitions.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<AlertCircle class="h-12 w-12 text-muted-foreground mb-4" />
					<h3 class="text-lg font-semibold mb-2">No Definitions Available</h3>
					<p class="text-muted-foreground mb-4">
						You need to create an entity definition before you can create entities.
					</p>
					<Button on:click={() => goto('/dynamic-entities/definitions')}>
						Go to Definitions
					</Button>
				</div>
			{:else}
				<div class="space-y-2">
					<Label for="definition-select">Entity Type</Label>
					<select
						id="definition-select"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						bind:value={selectedDefinitionId}
					>
						<option value="">Select a definition...</option>
						{#each data.definitions as definition}
							<option value={definition.id}>
								{definition.name}
								{#if definition.description}
									- {definition.description}
								{/if}
							</option>
						{/each}
					</select>
				</div>

				{#if selectedDefinition}
					<div class="mt-4 p-4 bg-muted rounded-lg">
						<h4 class="font-semibold mb-2">{selectedDefinition.name}</h4>
						{#if selectedDefinition.description}
							<p class="text-sm text-muted-foreground mb-2">{selectedDefinition.description}</p>
						{/if}
						<div class="flex gap-2 mt-2">
							<Badge variant="secondary">
								{Object.keys(schema).length} fields
							</Badge>
							{#if selectedDefinition.version}
								<Badge variant="outline">v{selectedDefinition.version}</Badge>
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>

	<!-- Entity Data Form -->
	{#if selectedDefinition && schemaFields.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Entity Data</CardTitle>
				<CardDescription>Fill in the entity fields</CardDescription>
			</CardHeader>
			<CardContent>
				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					{#each schemaFields as [fieldName, fieldDef]}
						{@const inputType = renderFieldInput(fieldName, fieldDef)}
						<div class="space-y-2">
							<Label for={fieldName}>
								{fieldDef.title || fieldName}
								{#if fieldDef.required}
									<span class="text-destructive">*</span>
								{/if}
							</Label>
							{#if fieldDef.description}
								<p class="text-sm text-muted-foreground">{fieldDef.description}</p>
							{/if}

							{#if inputType === 'textarea'}
								<Textarea
									id={fieldName}
									bind:value={entityData[fieldName]}
									placeholder={fieldDef.placeholder || ''}
									rows={4}
									on:input={() => handleFieldChange(fieldName, fieldDef)}
									class={validationErrors[fieldName] ? 'border-destructive' : ''}
								/>
							{:else if inputType === 'checkbox'}
								<div class="flex items-center space-x-2">
									<input
										type="checkbox"
										id={fieldName}
										bind:checked={entityData[fieldName]}
										on:change={() => handleFieldChange(fieldName, fieldDef)}
										class="h-4 w-4 rounded border-input"
									/>
									<Label for={fieldName} class="font-normal">
										{fieldDef.label || 'Enable'}
									</Label>
								</div>
							{:else if inputType === 'json'}
								<Textarea
									id={fieldName}
									value={JSON.stringify(entityData[fieldName], null, 2)}
									on:input={(e) => {
										try {
											entityData[fieldName] = JSON.parse(e.currentTarget.value);
											handleFieldChange(fieldName, fieldDef);
										} catch (err) {
											// Invalid JSON, don't update
										}
									}}
									placeholder={fieldDef.placeholder || 'Enter JSON...'}
									rows={6}
									class={validationErrors[fieldName] ? 'border-destructive font-mono text-sm' : 'font-mono text-sm'}
								/>
							{:else if inputType === 'enum-select'}
								<select
									id={fieldName}
									bind:value={entityData[fieldName]}
									on:change={() => handleFieldChange(fieldName, fieldDef)}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									class:border-destructive={validationErrors[fieldName]}
								>
									<option value="">Select an option...</option>
									{#each fieldDef.enum as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							{:else if inputType === 'number'}
								<Input
									id={fieldName}
									type="number"
									bind:value={entityData[fieldName]}
									placeholder={fieldDef.placeholder || ''}
									min={fieldDef.minimum}
									max={fieldDef.maximum}
									step={fieldDef.type === 'integer' ? '1' : 'any'}
									on:input={() => handleFieldChange(fieldName, fieldDef)}
									class={validationErrors[fieldName] ? 'border-destructive' : ''}
								/>
							{:else}
								<Input
									id={fieldName}
									type={getFieldInputType(fieldDef)}
									bind:value={entityData[fieldName]}
									placeholder={fieldDef.placeholder || ''}
									minlength={fieldDef.minLength}
									maxlength={fieldDef.maxLength}
									on:input={() => handleFieldChange(fieldName, fieldDef)}
									class={validationErrors[fieldName] ? 'border-destructive' : ''}
								/>
							{/if}

							{#if validationErrors[fieldName]}
								<p class="text-sm text-destructive flex items-center gap-1">
									<AlertCircle class="h-3 w-3" />
									{validationErrors[fieldName]}
								</p>
							{/if}
						</div>
					{/each}

					<div class="flex justify-end gap-2 pt-4">
						<Button variant="outline" type="button" on:click={() => goto('/dynamic-entities')}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !selectedDefinitionId}>
							{#if isSubmitting}
								Creating...
							{:else}
								<Save class="mr-2 h-4 w-4" />
								Create Entity
							{/if}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>

<style>
	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.5rem;
	}

	input[type='checkbox'] {
		accent-color: hsl(var(--primary));
	}
</style>
