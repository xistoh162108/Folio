/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        allowedDevOrigins: ["127.0.0.1", "localhost"],
      }
    : {}),
}

export default nextConfig
