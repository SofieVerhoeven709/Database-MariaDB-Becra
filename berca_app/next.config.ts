import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    typedEnv: true,
  },
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
