/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',  <-- Закомментируй или удали эту строку!
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;