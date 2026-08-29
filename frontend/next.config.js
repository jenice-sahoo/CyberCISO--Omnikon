/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // Ensure Vercel serves the static export correctly with rewrites
  // api routes are handled by vercel.json rewrites, not Next.js
};

module.exports = nextConfig;