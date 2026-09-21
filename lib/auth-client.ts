import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "./config";

export const getAuthBaseUrl = getApiBaseUrl;

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [adminClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
