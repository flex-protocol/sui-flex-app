/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["flex-sdk-dev"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ts?$/,
      use: [
        {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
