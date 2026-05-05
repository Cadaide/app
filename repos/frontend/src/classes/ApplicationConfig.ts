export class ApplicationConfig {
  static #env: Record<string, string> | undefined;

  static get backendPort(): number {
    return (
      Number(
        this.#env
          ? this.#env["BACKEND_PORT"]
          : typeof window != "undefined" && window.api
            ? window.api.env["BACKEND_PORT"]
            : process.env.BACKEND_PORT,
      ) || 3001
    );
  }

  static setEnv(env: Record<string, string>) {
    this.#env = env;
  }
}
