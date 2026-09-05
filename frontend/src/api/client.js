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

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  return new Error(data.detail || fallback || `Server returned error ${response.status}`);
}

const UNREACHABLE_MESSAGE =
  "Can't reach the LectraAI backend. Make sure the server is running, then try again.";

/**
 * fetch() rejects with a raw, unfriendly `TypeError: Failed to fetch` when
 * the server is unreachable (down, wrong port, offline) — distinct from an
 * HTTP error response, which is already handled by parseError above. This
 * turns only that network-level failure into a message a user can act on.
 */
async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    if (err instanceof TypeError) throw new Error(UNREACHABLE_MESSAGE);
    throw err;
  }
  return response;
}

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
