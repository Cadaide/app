import type { RPC } from "@cadaide/rpc";
import { HostRPC } from "./rpc";

enum HostEventTypes {
  "frontend.initialized",
}

const events = ["frontend.initialized"];

export class HostEvents {
  #handlers: Map<string, Array<(...args: any[]) => void>> = new Map();

  static #instance: HostEvents;
  static get instance() {
    return (this.#instance ??= new HostEvents());
  }

  constructor() {
    for (const event of events) {
      HostRPC.instance[
        event.split(".")[0]! as "frontend" | "backend"
      ].registerProcedure(
        "events." + event.split(".")[1]!,
        async (...args: any[]) => {
          this.#fire(event, ...args);
        },
      );
    }
  }

  on(event: keyof typeof HostEventTypes, handler: (...args: any[]) => void) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event)!.push(handler);

    return () => {
      this.#handlers
        .get(event)!
        .splice(this.#handlers.get(event)!.indexOf(handler), 1);
    };
  }

  #fire(event: string, ...args: any[]) {
    for (const handler of this.#handlers.get(event) || []) {
      handler(...args);
    }
  }

  static on(
    event: keyof typeof HostEventTypes,
    handler: (...args: any[]) => void,
  ) {
    return HostEvents.instance.on(event, handler);
  }
}
