import { createAuthClient } from "better-auth/react";

export function getAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Si accédé par une adresse IP (ex: 169.254.x.x ou 192.168.x.x), cibler le même hôte sur le port 3000
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:3000`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

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
