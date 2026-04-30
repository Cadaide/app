export class ApplicationConfig {
  static get backendPort(): number {
    return Number(process.env.NEXT_PUBLIC_BACKEND_PORT) || 3001;
  }
}
