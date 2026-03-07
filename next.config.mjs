/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  },
  async rewrites() {
    return [
      {
        source: '/folio',
        destination: 'https://folio-afterapp.vercel.app/folio',
      },
      {
        source: '/folio/:path*',
        destination: 'https://folio-afterapp.vercel.app/folio/:path*',
      },
    ];
  },
};

export default nextConfig;
