/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Адрес твоего Express бэкенда
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8000/uploads/:path*', // Для картинок
      },
    ];
  },
};

module.exports = nextConfig;