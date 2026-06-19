import { getAdminStats, getAdminPrds, getAdminLogs, getSprintConfig, updateSprintConfig, adminLogin as rawAdminLogin } from "@workspace/api-client-react";
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
