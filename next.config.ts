import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server only: let phones on your home Wi-Fi (e.g. 192.168.1.20) load
  // the game, so you can test multiplayer and the room QR code on a real
  // phone. Has no effect on the production build.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
