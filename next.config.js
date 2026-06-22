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
};

module.exports = nextConfig;
