/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aquí agregamos la IP que tu red está usando
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
};

export default nextConfig;