/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/knowledge",
        destination: "/notes",
        permanent: true,
      },
    ]
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        allowedDevOrigins: ["127.0.0.1", "localhost"],
      }
    : {}),
}

export default nextConfig
