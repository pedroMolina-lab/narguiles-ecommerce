const TOKEN_KEY = "auth_token";

const isBrowser = () => typeof window !== "undefined";

export const tokenStorage = {
  get(): string | null {
    return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
  },
  set(token: string): void {
    if (isBrowser()) localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (isBrowser()) localStorage.removeItem(TOKEN_KEY);
  },
};
