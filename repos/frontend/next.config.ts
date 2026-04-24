import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: "standalone",
  transpilePackages: ["monaco-editor", "@monaco-editor/react"],
};

export default nextConfig;
