/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  // 账号与真人匹配依赖服务端 API，需以 Node 服务运行，不能再做纯静态导出。
  output: "standalone",
  basePath: isProd ? "/procrastination-decoder" : "",
  images: {
    unoptimized: true,
  },
};
export default nextConfig;
