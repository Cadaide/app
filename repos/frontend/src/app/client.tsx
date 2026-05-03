"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "../components/base/LoadingScreen";
import { Application } from "@/classes/Application";
import { useEffect, useState } from "react";
import { ApplicationConfig } from "@/classes/ApplicationConfig";

const AppShell = dynamic(
  async () => (await import("../components/app/AppShell")).AppShell,
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  },
);

interface IClientProps {
  env: Record<string, string>;
}

export default function Client(props: IClientProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    ApplicationConfig.setEnv(props.env);

    if (typeof window == "undefined") return;

    Application.initialize(props.env).then(() => {
      setInitialized(true);
    });
  }, [props.env]);

  return (
    <div className="w-screen h-screen">
      {initialized ? <AppShell /> : <LoadingScreen />}
    </div>
  );
}
