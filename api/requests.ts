const base_url = "http://192.168.1.149:3000";

export interface VerificationResponse {
	message: string;
	id: string;
}

export interface VerifyResponse {
	message: string;
	token: string;
}

export interface ErrorResponse {
	error: string;
}

/**
 * Custom POST function to simplify API requests
 * @param endpoint The API endpoint path (without base URL)
 * @param body The request body object
 * @returns The parsed JSON response
 * @throws Error with message from the API if request fails
 */
async function post<T, B extends Record<string, unknown>>(
	endpoint: string,
	body: B,
): Promise<T> {
	const url = `${base_url}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = await response.json();

	if (!response.ok) {
		const errorData = data as ErrorResponse;
		throw new Error(errorData.error || `Failed to ${endpoint}`);
	}

	return data as T;
}

/**
 * Sends a verification request, this will send a code to the users phone.
 * @param number User phone number
 * @returns Parsed verification request response
 */
export const api_requestVerification = async (
	number: string,
): Promise<VerificationResponse> => {
	return post<VerificationResponse, { number: string }>(
		"/request-verification",
		{ number },
	);
};

/**
 * Verify a user verification attempt
 * @param id Verification attempt key
 * @param code User entered code
 * @returns A result containing credentials, may throw error
 */
export const api_verify = async (
	id: string,
	code: string,
): Promise<VerifyResponse> => {
	return post<VerifyResponse, { attempt_key: string; code: string }>(
		"/verify",
		{
			attempt_key: id,
			code: code,
		},
	);
};

/**
 * Cancel ongoing verification requests. Makes verifying impossible.
 * @param id Verification attempt key
 * @returns Nothing, may throw error.
 */
export const api_cancelVerification = async (id: string) => {
	return post<{ message: string }, { attempt_key: string }>(
		"/cancel-verification",
		{
			attempt_key: id,
		},
	);
};
