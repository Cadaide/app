import Client from "./client";

export const dynamic = 'force-dynamic';

export default function Page() {
  const env = process.env;

  return (
    <Client
      env={{
        BACKEND_PORT: env.BACKEND_PORT as string,
      }}
    />
  );
}
