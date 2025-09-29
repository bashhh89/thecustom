/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sow-workbench/db'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5578/api/:path*',
      },
    ];
  },
};

export default nextConfig;
