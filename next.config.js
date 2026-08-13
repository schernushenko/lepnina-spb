/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Важно для правильной сборки на Vercel
  // Если у тебя были проблемы с редиректами, можно их убрать или оставить:
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