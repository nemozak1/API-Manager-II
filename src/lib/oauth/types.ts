/**
 * OAuth and OIDC type definitions for API Manager II
 * Based on OAuth 2.1 and OpenID Connect specifications
 */

export interface OpenIdConnectConfiguration {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint?: string;
	jwks_uri?: string;
	registration_endpoint?: string;
	scopes_supported?: string[];
	response_types_supported: string[];
	response_modes_supported?: string[];
	grant_types_supported?: string[];
	acr_values_supported?: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	id_token_encryption_alg_values_supported?: string[];
	id_token_encryption_enc_values_supported?: string[];
	userinfo_signing_alg_values_supported?: string[];
	userinfo_encryption_alg_values_supported?: string[];
	userinfo_encryption_enc_values_supported?: string[];
	request_object_signing_alg_values_supported?: string[];
	request_object_encryption_alg_values_supported?: string[];
	request_object_encryption_enc_values_supported?: string[];
	token_endpoint_auth_methods_supported?: string[];
	token_endpoint_auth_signing_alg_values_supported?: string[];
	display_values_supported?: string[];
	claim_types_supported?: string[];
	claims_supported?: string[];
	service_documentation?: string;
	claims_locales_supported?: string[];
	ui_locales_supported?: string[];
	claims_parameter_supported?: boolean;
	request_parameter_supported?: boolean;
	request_uri_parameter_supported?: boolean;
	require_request_uri_registration?: boolean;
	op_policy_uri?: string;
	op_tos_uri?: string;
}

export interface OAuth2AccessTokenPayload {
	iss?: string; // Issuer
	sub?: string; // Subject
	aud?: string | string[]; // Audience
	exp: number; // Expiration time
	iat?: number; // Issued at
	auth_time?: number; // Authentication time
	nonce?: string;
	acr?: string; // Authentication Context Class Reference
	amr?: string[]; // Authentication Methods References
	azp?: string; // Authorized party
	scope?: string;
	client_id?: string;
	username?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	given_name?: string;
	family_name?: string;
	preferred_username?: string;
	roles?: string[];
	groups?: string[];
}

export interface OAuth2IdTokenPayload extends OAuth2AccessTokenPayload {
	// ID Token specific claims
	at_hash?: string; // Access token hash
	c_hash?: string; // Code hash
	s_hash?: string; // State hash
}

export interface OAuth2TokenResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
}

export interface OAuth2ErrorResponse {
	error: string;
	error_description?: string;
	error_uri?: string;
	state?: string;
}

export interface OAuth2AuthorizationRequest {
	response_type: 'code' | 'token' | 'id_token';
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	response_mode?: 'query' | 'fragment' | 'form_post';
	nonce?: string;
	display?: 'page' | 'popup' | 'touch' | 'wap';
	prompt?: 'none' | 'login' | 'consent' | 'select_account';
	max_age?: number;
	ui_locales?: string;
	id_token_hint?: string;
	login_hint?: string;
	acr_values?: string;
	code_challenge?: string;
	code_challenge_method?: 'plain' | 'S256';
}

export interface OAuth2TokenRequest {
	grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
	code?: string; // Required for authorization_code grant
	redirect_uri?: string; // Required for authorization_code grant
	client_id?: string;
	client_secret?: string;
	refresh_token?: string; // Required for refresh_token grant
	scope?: string;
	code_verifier?: string; // For PKCE
}

export interface WellKnownUri {
	provider: string;
	url: string;
}

export interface SessionOAuthData {
	provider: string;
	access_token: string;
	refresh_token?: string;
	id_token?: string;
	token_type?: string;
	expires_at?: Date;
	scope?: string;
	user_info?: OAuth2AccessTokenPayload;
}

export interface UserProfile {
	id: string;
	username?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	locale?: string;
	roles?: string[];
	groups?: string[];
	permissions?: string[];
}

export interface APIManagerSession {
	user?: UserProfile;
	oauth?: SessionOAuthData;
	csrf_token?: string;
	created_at?: Date;
	last_activity?: Date;
}

export interface OAuth2ProviderConfig {
	name: string;
	display_name: string;
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint?: string;
	scopes: string[];
	pkce_enabled?: boolean;
	additional_params?: Record<string, string>;
}

export type OAuth2State = {
	provider: string;
	redirect_url?: string;
	csrf_token: string;
	code_verifier?: string;
	created_at: number;
};

export interface OAuth2RequestError extends Error {
	code: string;
	description?: string;
	uri?: string;
}

export class OAuth2RequestError extends Error implements OAuth2RequestError {
	public code: string;
	public description?: string;
	public uri?: string;

	constructor(code: string, description?: string, uri?: string) {
		super(`OAuth request error: ${code}${description ? ` - ${description}` : ''}`);
		this.name = 'OAuth2RequestError';
		this.code = code;
		this.description = description;
		this.uri = uri;
	}
}