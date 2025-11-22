import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "productkit.sfo3.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
