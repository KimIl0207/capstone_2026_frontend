const AUTH_KEY = "isLoggedIn";
const AUTH_ROLE_KEY = "userRole";
const AUTH_USER_ID_KEY = "userId";
const AUTH_USERNAME_KEY = "username";
const AUTH_ACCESS_TOKEN_KEY = "accessToken";
const AUTH_REFRESH_TOKEN_KEY = "refreshToken";
const DEFAULT_USER_ID = import.meta.env.VITE_USER_ID ?? "1";

export type UserRole = "admin" | "user";

function normalizeRole(role?: string): UserRole {
  return role?.toLowerCase() === "admin" ? "admin" : "user";
}

export function login(role: UserRole = "user", userId = DEFAULT_USER_ID) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(AUTH_ROLE_KEY, role);
  localStorage.setItem(AUTH_USER_ID_KEY, userId);
}

export function loginWithToken(payload: {
  accessToken: string;
  refreshToken: string;
  userId: number | string;
  username: string;
  role: string;
}) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(AUTH_ROLE_KEY, normalizeRole(payload.role));
  localStorage.setItem(AUTH_USER_ID_KEY, String(payload.userId));
  localStorage.setItem(AUTH_USERNAME_KEY, payload.username);
  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, payload.refreshToken);
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_USER_ID_KEY);
  localStorage.removeItem(AUTH_USERNAME_KEY);
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getUserRole(): UserRole {
  return localStorage.getItem(AUTH_ROLE_KEY) === "admin" ? "admin" : "user";
}

export function getUserId() {
  return localStorage.getItem(AUTH_USER_ID_KEY) ?? DEFAULT_USER_ID;
}

export function getUsername() {
  return localStorage.getItem(AUTH_USERNAME_KEY) ?? "";
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) ?? undefined;
}

export function getRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) ?? undefined;
}

export function isAdmin() {
  return isAuthenticated() && getUserRole() === "admin";
}
