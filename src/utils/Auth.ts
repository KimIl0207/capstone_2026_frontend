const AUTH_KEY = "isLoggedIn";
const AUTH_ROLE_KEY = "userRole";

export type UserRole = "admin" | "user";

export function login(role: UserRole = "user") {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getUserRole(): UserRole {
  return localStorage.getItem(AUTH_ROLE_KEY) === "admin" ? "admin" : "user";
}

export function isAdmin() {
  return isAuthenticated() && getUserRole() === "admin";
}
