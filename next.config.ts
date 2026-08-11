import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All media is delivered through the Cloudinary loader (lib/cloudinary-loader.ts).
    // It injects f_auto,q_auto + width transforms for Cloudinary URLs and passes
    // other sources through untouched.
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
  },
};

export default nextConfig;
