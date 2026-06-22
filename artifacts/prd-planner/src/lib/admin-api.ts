import { getAdminStats, getAdminPrds, getAdminLogs, getSprintConfig, updateSprintConfig, adminLogin as rawAdminLogin, verifyAdmin, adminLogout as rawAdminLogout } from "@workspace/api-client-react";
import type { AdminLoginInput, GetAdminPrdsParams, SprintConfigUpdate } from "@workspace/api-client-react";

export function getAdminToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem("admin_token", token);
  } else {
    localStorage.removeItem("admin_token");
  }
}

export function getAdminAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminLogin(input: AdminLoginInput) {
  const res = await rawAdminLogin(input);
  setAdminToken(res.token);
  return res;
}

/**
 * Verify the stored token against the server. Returns true only if the
 * server confirms it (200); any error (401, network, no token) returns false.
 */
export async function verifyAdminToken(): Promise<boolean> {
  if (!getAdminToken()) return false;
  try {
    const res = await verifyAdmin({ headers: getAdminAuthHeaders() });
    return res.valid === true;
  } catch {
    return false;
  }
}

/**
 * Invalidate the token server-side, then clear it locally regardless of outcome.
 */
export async function adminLogout(): Promise<void> {
  try {
    await rawAdminLogout({ headers: getAdminAuthHeaders() });
  } catch {
    // even if the server call fails, we still clear the local token below
  }
  setAdminToken(null);
}

export async function fetchAdminStats() {
  return getAdminStats({ headers: getAdminAuthHeaders() });
}

export async function fetchAdminPrds(params?: GetAdminPrdsParams) {
  return getAdminPrds(params, { headers: getAdminAuthHeaders() });
}

export async function fetchAdminLogs() {
  return getAdminLogs({ headers: getAdminAuthHeaders() });
}

export async function fetchSprintConfig() {
  return getSprintConfig({ headers: getAdminAuthHeaders() });
}

export async function updateSprintConfigWithAuth(data: SprintConfigUpdate) {
  return updateSprintConfig(data, { headers: getAdminAuthHeaders() });
}
