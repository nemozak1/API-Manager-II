import { createLogger } from '$lib/utils/logger';
const logger = createLogger('OAuthProviderFactory');
import { OAuth2ClientWithConfig } from "./client";
import { dev } from '$app/environment';

export interface WellKnownUri {
    provider: string;
    url: string;
}

// Implement this for other OAuth2 providers as needed
// Then register them in the OAuth2ProviderFactory
interface OAuth2ProviderStrategy {
    providerName: string;
    initialize(config: WellKnownUri): Promise<OAuth2ClientWithConfig>;
    supports(provider: string): boolean;
    getProviderName(): string;
}

class KeyCloakStrategy implements OAuth2ProviderStrategy {
	providerName = 'keycloak';

	supports(provider: string): boolean {
		return provider === this.providerName;
	}

	getProviderName(): string {
		return this.providerName;
	}

	async initialize(config: WellKnownUri): Promise<OAuth2ClientWithConfig> {
		const clientId = dev ? 
			process.env.KEYCLOAK_OAUTH_CLIENT_ID : 
			import.meta.env.KEYCLOAK_OAUTH_CLIENT_ID;
		const clientSecret = dev ? 
			process.env.KEYCLOAK_OAUTH_CLIENT_SECRET : 
			import.meta.env.KEYCLOAK_OAUTH_CLIENT_SECRET;
		const callbackUrl = dev ? 
			process.env.APP_CALLBACK_URL : 
			import.meta.env.APP_CALLBACK_URL;

		if (!clientId || !clientSecret || !callbackUrl) {
			throw new Error(`Missing Keycloak OAuth configuration`);
		}

		const client = new OAuth2ClientWithConfig(
			clientId,
			clientSecret,
			callbackUrl
		);

		await client.initOIDCConfig(config.url);

		return client;
	}
}

class OBPOIDCStrategy implements OAuth2ProviderStrategy {
	providerName = 'obp-oidc'

	supports(provider: string): boolean {
		return provider === this.providerName;
	}

	getProviderName(): string {
		return this.providerName;
	}

	async initialize(config: WellKnownUri): Promise<OAuth2ClientWithConfig> {
		const clientId = dev ? 
			process.env.OBP_OAUTH_CLIENT_ID : 
			import.meta.env.OBP_OAUTH_CLIENT_ID;
		const clientSecret = dev ? 
			process.env.OBP_OAUTH_CLIENT_SECRET : 
			import.meta.env.OBP_OAUTH_CLIENT_SECRET;
		const callbackUrl = dev ? 
			process.env.APP_CALLBACK_URL : 
			import.meta.env.APP_CALLBACK_URL;

		logger.debug(`Initializing OAuth client with:`, {
			clientId: clientId ? '[SET]' : '[MISSING]',
			clientSecret: clientSecret ? '[SET]' : '[MISSING]',
			callbackUrl: callbackUrl ? callbackUrl : '[MISSING]',
			configUrl: config.url
		});

		if (!clientId || !clientSecret || !callbackUrl) {
			throw new Error(`Missing OBP OIDC OAuth configuration`);
		}

		const client = new OAuth2ClientWithConfig(
			clientId,
			clientSecret,
			callbackUrl
		);

		await client.initOIDCConfig(config.url);

		return client;
	}
}

export class OAuth2ProviderFactory {
	private strategies: OAuth2ProviderStrategy[] = [];
	private initializedClients = new Map<string, OAuth2ClientWithConfig>();

	constructor() {
		// Register any available strategies
		this.registerStrategy(new KeyCloakStrategy());
		this.registerStrategy(new OBPOIDCStrategy());
		// Add more as needed i.e. this.registerStrategy(new GoogleStrategy());
	}

	registerStrategy(strategy: OAuth2ProviderStrategy): void {
		this.strategies.push(strategy);
	}

	getStrategy(provider: string): OAuth2ProviderStrategy | undefined {
		return this.strategies.find((strategy) => strategy.supports(provider));
	}

	async initializeProvider(config: WellKnownUri): Promise<OAuth2ClientWithConfig | null> {
		if (!config.provider || !config.url) {
			throw new Error(`Invalid configuration for OAuth2 provider: ${JSON.stringify(config)}`);
		}

		const strategy = this.getStrategy(config.provider);

		if (!strategy) {
			logger.warn(`No strategy found for provider: ${config.provider}`);
			return null;
		}

		try {
			const client = await strategy.initialize(config);
			this.initializedClients.set(config.provider, client);
			logger.debug(`Initialized OAuth2 client for provider: ${config.provider}`);
			return client;
		} catch (error) {
			logger.error(`Failed to initialize OAuth2 client for provider ${config.provider}:`, error);
			throw error;
		}
	}

	getPrimaryClient(): OAuth2ClientWithConfig | undefined {
		// Return the first initialized client as the primary client
		return this.initializedClients.values().next().value;
	}

	getClientCount(): number {
		return this.initializedClients.size;
	}

	hasAnyClients(): boolean {
		return this.initializedClients.size > 0;
	}

	getClient(provider: string): OAuth2ClientWithConfig | undefined {
		return this.initializedClients.get(provider);
	}

	getAllClients(): Map<string, OAuth2ClientWithConfig> {
		return new Map(this.initializedClients);
	}

	getSupportedProviders(): string[] {
		return this.strategies.map((strategy) => strategy.getProviderName());
	}

	getFirstAvailableProvider(): string | null {
		const providers = Array.from(this.initializedClients.keys());
		return providers.length > 0 ? providers[0] : null;
	}
}

export const oauth2ProviderFactory = new OAuth2ProviderFactory();