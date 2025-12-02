<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { ArrowLeft, Save, AlertCircle, Database } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let entity = data.entity;
	let definition = data.definition;
	let schema = definition.schema || {};
	let entityData = { ...entity.data };
	let isSubmitting = false;
	let validationErrors: Record<string, string> = {};

	$: schemaFields = Object.entries(schema);

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
		if (!validateAllFields()) {
			toast.error('Please fix validation errors before submitting');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(`/api/dynamic-entities/${entity.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					data: entityData
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update entity');
			}

			toast.success('Entity updated successfully');
			goto(`/dynamic-entities/${entity.id}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update entity');
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
	<title>Edit Entity {entity.id} - API Manager</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<Button
				variant="ghost"
				on:click={() => goto(`/dynamic-entities/${entity.id}`)}
				class="mb-2 -ml-4"
			>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Entity
			</Button>
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold tracking-tight">Edit Entity</h1>
				<Badge variant="secondary">{definition.name}</Badge>
			</div>
			<p class="text-muted-foreground mt-1">Update entity data</p>
		</div>
	</div>

	<!-- Entity Info -->
	<Card>
		<CardHeader>
			<CardTitle>Entity Information</CardTitle>
			<CardDescription>Editing entity {entity.id}</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					<p class="text-sm font-medium text-muted-foreground">Last Updated</p>
					<p class="text-sm">{new Date(entity.updated_at).toLocaleString()}</p>
				</div>
			</div>
			{#if definition.description}
				<div class="mt-4 pt-4 border-t">
					<p class="text-sm text-muted-foreground">{definition.description}</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Entity Data Form -->
	<Card>
		<CardHeader>
			<CardTitle>Entity Data</CardTitle>
			<CardDescription>Edit the entity fields</CardDescription>
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
								class={validationErrors[fieldName]
									? 'border-destructive font-mono text-sm'
									: 'font-mono text-sm'}
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
					<Button
						variant="outline"
						type="button"
						on:click={() => goto(`/dynamic-entities/${entity.id}`)}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							Saving...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
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

	input[type='checkbox'] {
		accent-color: hsl(var(--primary));
	}
</style>
