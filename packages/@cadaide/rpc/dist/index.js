// src/classes/RPC.ts
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
var RPC = class {
  // If true, log debug messages
  #debug;
  // Default timeout for RPC calls in milliseconds
  #timeout = 1e4;
  // Field for saving remote message handler function
  #remoteMessageHandler = () => {
  };
  // Map for storing local procedures [name, function]
  #procedures = /* @__PURE__ */ new Map();
  // Map for storing promises (rpc calls) [id, {resolve, reject}] that are waiting for a response
  #promises = /* @__PURE__ */ new Map();
  /**
   * Creates a new instance of the RPC class.
   * @param debug If true, log debug messages.
   * @param timeout Default timeout for RPC calls in milliseconds.
   */
  constructor(debug, timeout = 1e4) {
    this.#debug = debug;
    this.#timeout = timeout;
  }
  /**
   * Registers a procedure to be invoked by the remote side.
   * @param name Procedure name.
   * @param procedure Procedure function.
   */
  registerProcedure(name, procedure) {
    this.#log("Registering procedure:", name);
    this.#procedures.set(name, procedure);
  }
  /**
   * Invokes a procedure on the remote side and waits for the response.
   * @param name Procedure name.
   * @param args Procedure arguments.
   * @returns Promise that resolves with the procedure result.
   * @throws Error if the procedure is not registered on the remote side, the remote side throws an error or the call times out.
   */
  async callProcedure(name, ...args) {
    this.#log("Calling procedure:", name, args);
    const packet = {
      type: "rpc:packet" /* RPCPacket */,
      id: generateId(),
      kind: "call" /* Call */,
      name,
      args
    };
    this.#sendPacket(packet);
    return new Promise((resolve, reject) => {
      const timeoutPromise = setTimeout(() => {
        reject(new Error("Timeout"));
        this.#promises.delete(packet.id);
      }, this.#timeout);
      const whenDone = (value) => {
        clearTimeout(timeoutPromise);
        resolve(value);
        this.#promises.delete(packet.id);
      };
      const whenError = (error) => {
        clearTimeout(timeoutPromise);
        reject(error);
        this.#promises.delete(packet.id);
      };
      this.#promises.set(packet.id, {
        resolve: whenDone,
        reject: whenError
      });
    });
  }
  /**
   * Handles a remote message.
   * @param message The remote message to handle.
   */
  async handleRemoteMessage(message) {
    const parsed = this.#parseAndValidatePacket(message);
    if (typeof parsed == "string") {
      this.#log("Throwing out invalid packet:", parsed);
      return;
    }
    this.#log("Got remote packet:", parsed);
    if (parsed.kind == "call" /* Call */) {
      const result = await this.#invokeProcedure(parsed.name, parsed.args);
      if (result instanceof Error) {
        this.#sendPacket({
          type: "rpc:packet" /* RPCPacket */,
          id: parsed.id,
          kind: "error" /* Error */,
          error: {
            message: result.message
          }
        });
        return;
      }
      this.#sendPacket({
        type: "rpc:packet" /* RPCPacket */,
        id: parsed.id,
        kind: "response" /* Response */,
        result
      });
    } else if (parsed.kind == "error" /* Error */) {
      this.#log("Got error:", parsed.error.message);
      const promise = this.#promises.get(parsed.id);
      if (!promise) return;
      promise.reject(new Error(parsed.error.message));
    } else if (parsed.kind == "response" /* Response */) {
      this.#log("Got response:", parsed);
      const promise = this.#promises.get(parsed.id);
      if (!promise) return;
      promise.resolve(parsed.result);
      this.#promises.delete(parsed.id);
    }
  }
  /**
   * Sets the remote message handler.
   * @param handler The remote message handler to set.
   */
  setRemoteMessageHandler(handler) {
    this.#remoteMessageHandler = handler;
  }
  /**
   * Sends a packet to the remote side.
   * @param packet The packet to send.
   */
  #sendPacket(packet) {
    this.#log("Sending packet:", packet);
    const stringifiedPacket = JSON.stringify(packet);
    this.#remoteMessageHandler(stringifiedPacket);
  }
  /**
   * Parses and validates a packet.
   * @param data The packet to parse.
   * @returns Validated packet or an error message.
   */
  #parseAndValidatePacket(data) {
    try {
      const parsedPacket = JSON.parse(data);
      if (parsedPacket.type != "rpc:packet" /* RPCPacket */) return "error:badID";
      if (parsedPacket.kind != "call" /* Call */ && parsedPacket.kind != "response" /* Response */ && parsedPacket.kind != "error" /* Error */)
        return "error:badKind";
      if (!("id" in parsedPacket)) return "error:noId";
      if (typeof parsedPacket.id != "string") return "error:badId";
      if (parsedPacket.kind == "error" /* Error */) {
        if (!("error" in parsedPacket)) return "error:noError";
        if (typeof parsedPacket.error?.message !== "string")
          return "error:badError";
        return parsedPacket;
      } else if (parsedPacket.kind == "response" /* Response */) {
        if (!("result" in parsedPacket)) return "error:noResult";
        return parsedPacket;
      } else {
        if (!("args" in parsedPacket)) return "error:noArgs";
        if (typeof parsedPacket.name !== "string") return "error:badName";
        if (!Array.isArray(parsedPacket.args)) return "error:badArgs";
      }
      return parsedPacket;
    } catch (err) {
      return "error:jsonParseError";
    }
  }
  /**
   * Invokes a local procedure.
   * @param name The name of the procedure to invoke.
   * @param args The arguments to pass to the procedure.
   * @returns Promise that resolves with the procedure result or an error.
   */
  async #invokeProcedure(name, args) {
    const procedure = this.#procedures.get(name);
    if (!procedure) return new Error("Procedure not found");
    const result = await procedure(...args).catch((e) => {
      return new Error(e.message);
    });
    return result;
  }
  /**
   * Logs debug messages if debug mode is enabled.
   * @param data Data to log.
   */
  #log(...data) {
    if (!this.#debug) return;
    console.log("[RPC DEBUG]", ...data);
  }
};
export {
  RPC
};
