// Simplified auth hook for desktop app - no authentication required
// Returns a mock user for compatibility with existing code

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  return {
    user: {
      id: 1,
      name: "Desktop User",
      email: "user@localhost",
      openId: "desktop-user",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}

export function getLoginUrl(_returnPath?: string) {
  // No login needed for desktop app
  return "/";
}
