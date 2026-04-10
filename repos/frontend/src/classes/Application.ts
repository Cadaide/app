import { Settings } from "./Settings";

export class Application {
  static #initialized: boolean = false;
  static #initializedListeners: (() => void)[] = [];

  static async initialize() {
    if (Application.#initialized) return;

    await Settings.instance.load();

    Application.#initialized = true;
    Application.#notifyIfInitialized();
  }

  static onInitialized(listener: () => void) {
    Application.#initializedListeners.push(listener);

    return () => {
      Application.#initializedListeners.splice(
        Application.#initializedListeners.indexOf(listener),
        1,
      );
    };
  }

  static #notifyIfInitialized() {
    if (Application.#initialized) {
      Application.#initializedListeners.forEach((listener) => {
        listener();
      });

      Application.#initializedListeners = [];
    }
  }

  static get isNative() {
    return typeof window !== "undefined" && window.api !== undefined;
  }
}
