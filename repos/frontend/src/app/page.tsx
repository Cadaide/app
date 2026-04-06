"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "../components/base/LoadingScreen";

const AppShell = dynamic(
  async () => (await import("../components/app/AppShell")).AppShell,
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  },
);

export default function Page() {
  return (
    <div className="w-screen h-screen">
      <AppShell />
    </div>
  );
}
