import { dirname } from "node:path";
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL(`${process.env.BLOB_BASE_URL}/**`)],
  },

  // 🔥 مهم جداً: السماح لـ 127.0.0.1 بالوصول إلى dev server
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  turbopack: {
    root: dirname(__filename),
  },
};

export default nextConfig;
