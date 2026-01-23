/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Используем переменную окружения для URL API, или localhost для разработки
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // Адрес Express бэкенда
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`, // Для картинок
      },
    ];
  },
};

module.exports = nextConfig;