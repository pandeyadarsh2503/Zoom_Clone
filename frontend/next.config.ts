import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Pin the workspace root to this folder so the build ignores stray lockfiles
  // elsewhere on the machine (e.g. a package-lock.json in the home directory).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
