import { createAuthClient } from "better-auth/react";
import { getApiBaseUrl } from "./config";

export const getAuthBaseUrl = getApiBaseUrl;

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
