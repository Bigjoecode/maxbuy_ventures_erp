/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    // No remote images are used yet. Avoid a wildcard hostname here — it exposes
    // the Next.js Image Optimizer to DoS/SSRF. When adding product images, list
    // only the specific CDN host(s), e.g.:
    //   remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    remotePatterns: [],
  },
  async headers() {
    // Baseline security headers applied to every response. The CSP is a
    // pragmatic starting point: Next.js injects inline bootstrap scripts and
    // Tailwind injects inline styles, so 'unsafe-inline' is required until we
    // move to a nonce-based CSP. Tighten script-src with nonces in a later pass.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
