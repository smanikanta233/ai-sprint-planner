import { 
  getAdminStats, 
  getSprintConfig, 
  updateSprintConfig, 
  getAdminLogs,
  AdminStats,
  SprintConfig,
  SprintConfigUpdate,
  AdminLog
} from "@workspace/api-client-react";

export function getAuthToken() {
  return localStorage.getItem("admin_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("admin_token");
}

async function withAuth<T>(fetcher: (opts?: RequestInit) => Promise<T>, opts?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized");

  try {
    return await fetcher({
      ...opts,
      headers: {
        ...opts?.headers,
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error: any) {
    if (error?.status === 401) {
      clearAuthToken();
      window.location.href = "/admin/login";
    }
    throw error;
  }
}

async function withAuthAndBody<T, B>(fetcher: (body: B, opts?: RequestInit) => Promise<T>, body: B, opts?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized");

  try {
    return await fetcher(body, {
      ...opts,
      headers: {
        ...opts?.headers,
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error: any) {
    if (error?.status === 401) {
      clearAuthToken();
      window.location.href = "/admin/login";
    }
    throw error;
  }
}

export const adminApi = {
  getAdminStats: (opts?: RequestInit) => withAuth(getAdminStats, opts),
  getSprintConfig: (opts?: RequestInit) => withAuth(getSprintConfig, opts),
  updateSprintConfig: (body: SprintConfigUpdate, opts?: RequestInit) => withAuthAndBody(updateSprintConfig, body, opts),
  getAdminLogs: (opts?: RequestInit) => withAuth(getAdminLogs, opts),
};
