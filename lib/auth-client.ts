import { createAuthClient } from "better-auth/react";

export function getAuthBaseUrl(): string {
  // En production ou si explicitement configuré, toujours privilégier la variable d'environnement
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Si accédé sur le réseau local de dev par adresse IP privée (192.168.x.x, 10.x.x.x, 172.x.x.x, 169.254.x.x)
    const isLocalIp =
      /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.)/.test(hostname);
    if (isLocalIp) {
      return `http://${hostname}:3000`;
    }
  }

  return "http://localhost:3000";
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
