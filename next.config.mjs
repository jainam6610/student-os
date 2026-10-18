/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Ensure clean chunk names and stable builds
  productionBrowserSourceMaps: false,
  // Prevent accidental server dependencies
  experimental: {
    // Ensure no server components sneak in
    esmExternals: true,
  },
  // Static export disables headers/rewrites/redirects automatically.
  // For Cloudflare Pages, use public/_headers and public/_redirects instead.
}

export default nextConfig
