/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Kubernetes ingress de Emergent enruta /api/* al backend :8001.
  // Para que Tinkú use /api dentro de Next.js si hiciera falta, los
  // webhooks externos los vamos a servir bajo /webhooks/* y evitamos /api/*.
  // Server Actions no pasan por rutas explícitas → seguras.
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Allow Server Actions from proxy origins (Emergent preview environment)
      allowedOrigins: [
        'regla-clara.preview.emergentagent.com',
        'regla-clara.cluster-0.preview.emergentcf.cloud',
        'localhost:3000',
      ],
    },
  },
};

export default nextConfig;
