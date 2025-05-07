import { storage } from "@/utils/storage";

// const base_url = "http://192.168.1.149:3000";
const base_url = "http://172.20.10.3:3000";

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

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
 * @param requiresAuth Whether the request requires authentication
 * @returns The parsed JSON response
 * @throws Error with message from the API if request fails
 */
async function post<T, B extends Record<string, unknown>>(
  endpoint: string,
  body: B,
  requiresAuth = true,
): Promise<T> {
  const url = `${base_url}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = await storage.getString("auth_token");
    if (!token) {
      throw new Error("Authentication required");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
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
 * Custom GET function to simplify API requests with authentication
 * @param endpoint The API endpoint path (without base URL)
 * @param requiresAuth Whether the request requires authentication
 * @returns The parsed JSON response
 * @throws Error with message from the API if request fails
 */
async function get<T>(endpoint: string, requiresAuth = true): Promise<T> {
  const url = `${base_url}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {};

  if (requiresAuth) {
    const token = await storage.getString("auth_token");
    if (!token) {
      throw new Error("Authentication required");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
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
 * @returns Result containing verification response or error
 */
export const api_requestVerification = async (
  number: string,
): Promise<Result<VerificationResponse, Error>> => {
  return tryCatch(
    post<VerificationResponse, { number: string }>(
      "/request-verification",
      { number },
      false,
    )
  );
};

/**
 * Verify a user verification attempt
 * @param id Verification attempt key
 * @param code User entered code
 * @returns A result containing credentials or error
 */
export const api_verify = async (
  id: string,
  code: string,
): Promise<Result<VerifyResponse, Error>> => {
  return tryCatch(
    post<VerifyResponse, { attempt_key: string; code: string }>(
      "/verify",
      {
        attempt_key: id,
        code: code,
      },
      false,
    )
  );
};

/**
 * Cancel ongoing verification requests. Makes verifying impossible.
 * @param id Verification attempt key
 * @returns Result with success message or error
 */
export const api_cancelVerification = async (id: string): Promise<Result<{ message: string }, Error>> => {
  return tryCatch(
    post<{ message: string }, { attempt_key: string }>(
      "/cancel-verification",
      {
        attempt_key: id,
      },
      false,
    )
  );
};

/**
 * Interface for contact data to be uploaded
 */
export interface ContactData {
  name: string;
  country_code: string;
  number: string;
}

/**
 * Upload contacts to the server
 * @param contacts Array of contacts with name and phone number
 * @returns Result with success message or error
 */
export const api_addContacts = async (contacts: ContactData[]): Promise<Result<{ message: string }, Error>> => {
  return tryCatch(
    post<{ message: string }, { contacts: ContactData[] }>(
      "/api/add-contacts",
      { contacts },
      true,
    )
  );
};

export interface GetContact {
	name: string;
	user_key: string;
}

/**
 * Get contacts from the server
 * @param userKey The user key to get contacts for
 * @returns Result with contacts array or error
 */
export const api_getContacts = async (userKey: string): Promise<Result<GetContact[], Error>> => {
	return tryCatch(
    get<GetContact[]>(`/api/contacts?user=${userKey}`, true)
  );
}