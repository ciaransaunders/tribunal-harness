import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable server-side features for API routes
    serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
