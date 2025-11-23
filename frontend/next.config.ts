import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "productkit.sfo3.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "*.fal.media",
            },
            {
                protocol: "https",
                hostname: "placehold.co",
            },
        ],
    },
};

export default nextConfig;
