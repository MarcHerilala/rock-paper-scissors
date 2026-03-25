import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tensorflow-models/hand-pose-detection",
    "@tensorflow/tfjs-backend-wasm",
    "@tensorflow/tfjs-core"
  ],
  serverExternalPackages: ["@mediapipe/hands", "@tensorflow/tfjs-node"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@mediapipe/hands": false,
      };
    }
    return config;
  },
};

export default nextConfig;
