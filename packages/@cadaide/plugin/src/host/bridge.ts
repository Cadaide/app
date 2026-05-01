declare const ___cadaide_server_bridge_post: (msg: string) => void;
declare let ___cadaide_server_bridge_onMessageCallbacks: Array<
  (msg: string) => void
>;
declare const ___cadaide_debug_log: (msg: string) => void;

export class HostBridge {
  static #post(msg: string) {
    ___cadaide_server_bridge_post(msg);
  }

  static #onMessage(callback: (msg: string) => void) {
    ___cadaide_server_bridge_onMessageCallbacks.push(callback);

    return () => {
      this.#offMessage(callback);
    };
  }

  static #offMessage(callback: (msg: string) => void) {
    ___cadaide_server_bridge_onMessageCallbacks =
      ___cadaide_server_bridge_onMessageCallbacks.filter(
        (cb) => cb !== callback,
      );
  }

  /**
   * Execute a command without waiting for result
   *
   * @param namespace The namespace of the command (e.g. "window", "editor", ...)
   * @param command The command to execute
   * @param data The data to send to the command (optional)
   * @returns void
   */
  static execute(namespace: string, command: string, data?: unknown): void {
    const payload = JSON.stringify({
      type: "execute",
      namespace,
      command,
      data,
    });

    this.#post(payload);
  }

  /**
   * Execute a command and wait for result
   *
   * @param namespace The namespace of the command (e.g. "window", "editor", ...)
   * @param command The command to execute
   * @param data The data to send to the command (optional)
   * @returns The result of the command
   */
  static executeWithResponse(
    namespace: string,
    command: string,
    data?: unknown,
    callback?: (data: unknown) => void,
  ) {
    const responseId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const payload = JSON.stringify({
      type: "execute",
      namespace,
      command,
      data,
      responseId,
    });

    const off = this.#onMessage((msg) => {
      const data = JSON.parse(msg);

      if (
        data.type === "call_response" &&
        data.data.responseId === responseId
      ) {
        if (callback) callback(data.data.data);
        off();
      }
    });

    this.#post(payload);
  }

  static provideCallHandler(
    namespace: string,
    command: string,
    handler: (data: unknown) => unknown,
  ) {
    this.#onMessage((msg) => {
      const data = JSON.parse(msg);

      if (
        data.type !== "call" ||
        data.data.namespace !== namespace ||
        data.data.command !== command
      ) {
        return;
      }

      const result = handler(data.data.data);

      if (data.data.responseId) {
        this.#post(
          JSON.stringify({
            type: "call_response",
            data: {
              responseId: data.data.responseId,
              data: result,
            },
          }),
        );
      }
    });
  }
}
