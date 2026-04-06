"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "../components/base/LoadingScreen";
import { Application } from "@/classes/Application";
import { useEffect, useState } from "react";

const AppShell = dynamic(
  async () => (await import("../components/app/AppShell")).AppShell,
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  },
);

export default function Page() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    Application.initialize().then(() => {
      setInitialized(true);
    });
  }, []);

  return (
    <div className="w-screen h-screen">
      {initialized ? <AppShell /> : <LoadingScreen />}
    </div>
  );
}
