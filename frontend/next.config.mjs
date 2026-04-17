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
      // Kubernetes ingress de Emergent reescribe x-forwarded-host al preview URL pero
      // deja origin apuntando al cluster interno. Next.js 14.2 no soporta wildcards en
      // allowedOrigins (usa includes exact), y el rewrite en middleware no alcanza al
      // handler de SA. Workaround: listamos exactos todos los cluster-N posibles.
      allowedOrigins: [
        'regla-clara.preview.emergentagent.com',
        'localhost:3000',
        ...Array.from({ length: 40 }, (_, i) => `regla-clara.cluster-${i}.preview.emergentcf.cloud`),
      ],
      allowedForwardedHosts: [
        'regla-clara.preview.emergentagent.com',
        'localhost:3000',
      ],
    },
  },
};

export default nextConfig;
