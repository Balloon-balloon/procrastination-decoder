/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? "/procrastination-decoder" : "",
  trailingSlash: isGithubPages,
  assetPrefix: isGithubPages ? "/procrastination-decoder" : undefined,
  images: {
    unoptimized: true,
  },
};
export default nextConfig;
