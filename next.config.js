/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // Регулярное выражение: всё, кроме пустой строки (то есть, кроме главной страницы)
        source: '/:path((?!$).*)',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;