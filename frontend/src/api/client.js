/**
 * LectraAI API Client
 *
 * Talks to the FastAPI backend. Base URL defaults to the local dev server
 * (http://127.0.0.1:8000) and can be overridden at build time with
 * VITE_API_BASE_URL without any code change.
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  'http://127.0.0.1:8000';

export const AUTH_TOKEN_KEY = 'lectra_auth_token';

/**
 * Token management utilities.
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

/**
 * Registry for centralized 401 unauthorized handling.
 */
let unauthorizedHandler = null;

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/**
 * Attaches Authorization: Bearer <token> if a token is present.
 */
export function authHeaders(existingHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...existingHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  return new Error(data.detail || fallback || `Server returned error ${response.status}`);
}

const UNREACHABLE_MESSAGE =
  "Can't reach the LectraAI backend. Make sure the server is running, then try again.";

/**
 * fetch() wrapper with error handling, unreachable backend detection,
 * automatic Authorization header attachment, and centralized 401 handling.
 */
async function requestJson(url, options = {}) {
  const headers = authHeaders(options.headers || {});
  const mergedOptions = { ...options, headers };

  let response;
  try {
    response = await fetch(url, mergedOptions);
  } catch (err) {
    if (err instanceof TypeError) throw new Error(UNREACHABLE_MESSAGE);
    throw err;
  }

  // Intercept 401 Unauthorized globally
  if (response.status === 401 && typeof unauthorizedHandler === 'function') {
    try {
      unauthorizedHandler();
    } catch (e) {
      console.warn('Error in unauthorizedHandler:', e);
    }
  }

  return response;
}

/* =========================================================================
   AUTHENTICATION ENDPOINTS (Phase 2 & 3)
   ========================================================================= */

export async function registerApi({ name, email, password }) {
  const response = await requestJson(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Registration failed');
  }

  return response.json();
}

export async function loginApi({ email, password }) {
  const response = await requestJson(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Invalid email or password');
  }

  return response.json();
}

export async function fetchCurrentUserApi() {
  const response = await requestJson(`${API_BASE_URL}/auth/me`);

  if (!response.ok) {
    throw await parseError(response, 'Failed to fetch current user profile');
  }

  return response.json();
}

export async function logoutApi() {
  try {
    const response = await requestJson(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchUserLecturesApi() {
  const response = await requestJson(`${API_BASE_URL}/lectures`);

  if (!response.ok) {
    throw await parseError(response, 'Failed to fetch user lectures');
  }

  return response.json();
}

export async function claimLocalLecturesApi(taskIds = []) {
  const response = await requestJson(`${API_BASE_URL}/lectures/claim-local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Failed to claim local lectures');
  }

  return response.json();
}

/* =========================================================================
   LECTURE & STUDY PACK PIPELINE ENDPOINTS
   ========================================================================= */

export async function submitYoutubeUrl(url, forceRefresh = false) {
  const response = await requestJson(`${API_BASE_URL}/youtube`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, force_refresh: forceRefresh }),
  });

  if (!response.ok) {
    throw await parseError(response, `Server returned error ${response.status}`);
  }

  return response.json();
}

export async function fetchTaskStatus(taskId) {
  const response = await requestJson(`${API_BASE_URL}/tasks/${taskId}`);

  if (!response.ok) {
    throw await parseError(response, `Failed to fetch status for task ${taskId}`);
  }

  return response.json();
}

export async function fetchTaskContent(taskId) {
  const response = await requestJson(`${API_BASE_URL}/tasks/${taskId}/content`);

  if (!response.ok) {
    throw await parseError(response, `Failed to fetch study pack for task ${taskId}`);
  }

  return response.json();
}

export function getDownloadUrl(taskId) {
  return `${API_BASE_URL}/download/${taskId}`;
}

/**
 * Downloads the authenticated PDF as a Blob object, ensuring Authorization
 * header is passed so protected /download/{taskId} endpoint does not 401.
 */
export async function downloadPdfBlob(taskId) {
  const response = await requestJson(`${API_BASE_URL}/download/${taskId}`);

  if (!response.ok) {
    throw await parseError(response, `Failed to download study guide PDF`);
  }

  return response.blob();
}
