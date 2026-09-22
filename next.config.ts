import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.100',
    '169.254.123.153',
    '169.254.141.253',
    '169.254.109.248',
    '172.18.80.1',
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api-kanto.gastsar.fr",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  async headers() {
    return [
      {
        // Applique les headers de sécurité sur toutes les routes
        source: "/(.*)",
        headers: [
          {
            // Empêche le navigateur de deviner le type MIME — prévient les attaques MIME sniffing
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Empêche l'application d'être incluse dans une iframe — prévient le clickjacking
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Active le filtre XSS du navigateur (legacy mais conservé pour compatibilité)
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Contrôle les informations de référent envoyées lors de la navigation
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Restreint les fonctionnalités navigateur sensibles (géoloc, caméra, micro)
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Content Security Policy : n'autoriser que les ressources de confiance
            // 'unsafe-inline' conservé pour Next.js (styles inline de framework)
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval requis par Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://api-kanto.gastsar.fr blob: ${process.env.NEXT_PUBLIC_API_URL ?? ""} ${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""} ${isDev ? "http:" : ""}`.trim().replace(/\s+/g, " "),
              isDev
                ? "connect-src 'self' http: ws: https: wss:"
                : "connect-src 'self' https://api-kanto.gastsar.fr " + (process.env.NEXT_PUBLIC_API_URL ?? ""),
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
