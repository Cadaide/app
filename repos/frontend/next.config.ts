import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  transpilePackages: ["monaco-editor", "@monaco-editor/react"],
};

export default nextConfig;
