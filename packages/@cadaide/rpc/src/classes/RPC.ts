import type { IProcedure } from "../types/Procedure";
import {
  EPacketKind,
  EPacketType,
  type IErrorPacket,
  type IPacket,
  type IResponsePacket,
} from "../types/Packet";
import { v4 } from "uuid";
import type { IRemoteMessageHandler } from "../types/Handler";

export class RPC {
  // If true, log debug messages
  #debug?: boolean;
  // Default timeout for RPC calls in milliseconds
  #timeout: number = 10000;

  // Field for saving remote message handler function
  #remoteMessageHandler: IRemoteMessageHandler = () => {};

  // Map for storing local procedures [name, function]
  #procedures: Map<string, IProcedure> = new Map();

  // Map for storing promises (rpc calls) [id, {resolve, reject}] that are waiting for a response
  #promises: Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  /**
   * Creates a new instance of the RPC class.
   * @param debug If true, log debug messages.
   * @param timeout Default timeout for RPC calls in milliseconds.
   */
  constructor(debug?: boolean, timeout: number = 10000) {
    this.#debug = debug;
    this.#timeout = timeout;
  }

  /**
   * Registers a procedure to be invoked by the remote side.
   * @param name Procedure name.
   * @param procedure Procedure function.
   */
  registerProcedure(name: string, procedure: IProcedure) {
    this.#log("Registering procedure:", name);

    // Save procedure into procedures map to invoke it later
    this.#procedures.set(name, procedure);
  }

  /**
   * Invokes a procedure on the remote side and waits for the response.
   * @param name Procedure name.
   * @param args Procedure arguments.
   * @returns Promise that resolves with the procedure result.
   * @throws Error if the procedure is not registered on the remote side, the remote side throws an error or the call times out.
   */
  async callProcedure<T>(name: string, ...args: any[]): Promise<T> {
    this.#log("Calling procedure:", name, args);

    // Construct a packet
    const packet: IPacket = {
      type: EPacketType.RPCPacket,
      id: v4(),
      kind: EPacketKind.Call,
      name,
      args,
    };

    // Send packet to the remote side
    this.#sendPacket(packet);

    // Create a promise that will resolve when the response is received or reject if the call times out/remote side throws an error
    return new Promise<T>((resolve, reject) => {
      // Timeout promise to reject the call if the response is not received within the timeout period
      // This is necessary to prevent that the call hangs up indefinitely
      const timeoutPromise = setTimeout(() => {
        reject(new Error("Timeout"));

        this.#promises.delete(packet.id);
      }, this.#timeout);

      // Function to handle the response
      const whenDone = (value: any) => {
        clearTimeout(timeoutPromise);
        resolve(value);

        this.#promises.delete(packet.id);
      };

      // Function to handle the error
      const whenError = (error: Error) => {
        clearTimeout(timeoutPromise);
        reject(error);

        this.#promises.delete(packet.id);
      };

      // Save promise to promises map to resolve it later when the response is received
      this.#promises.set(packet.id, {
        resolve: whenDone as (data: unknown) => void,
        reject: whenError as (error: Error) => void,
      });
    });
  }

  /**
   * Handles a remote message.
   * @param message The remote message to handle.
   */
  async handleRemoteMessage(message: string) {
    // Parse and validate packet
    const parsed = this.#parseAndValidatePacket(message);

    // If packet is invalid, log it and return
    // We don't send error back, because we probably won't be able to retrieve the packet ID.
    if (typeof parsed == "string") {
      this.#log("Throwing out invalid packet:", parsed);

      return;
    }

    this.#log("Got remote packet:", parsed);

    // If packet is a call, invoke the procedure and send back the response
    if (parsed.kind == EPacketKind.Call) {
      // Inkove the procedure
      const result = await this.#invokeProcedure(parsed.name, parsed.args);

      // If procedure threw an error, send error packet in response
      if (result instanceof Error) {
        this.#sendPacket({
          type: EPacketType.RPCPacket,
          id: parsed.id,
          kind: EPacketKind.Error,
          error: {
            message: result.message,
          },
        });

        return;
      }

      // Send response packet with the result
      this.#sendPacket({
        type: EPacketType.RPCPacket,
        id: parsed.id,
        kind: EPacketKind.Response,
        result: result,
      });
    }
    // If packet is an error, reject the promise
    else if (parsed.kind == EPacketKind.Error) {
      this.#log("Got error:", (parsed as IErrorPacket).error.message);

      // Find the promise by the packet ID and reject it
      const promise = this.#promises.get(parsed.id);
      if (!promise) return; // Promise not found - ignore

      // Remove the promise from the map
      promise.reject(new Error((parsed as IErrorPacket).error.message));
    }
    // If packet is a response, resolve the promise
    else if (parsed.kind == EPacketKind.Response) {
      this.#log("Got response:", parsed);

      // Find the promise by the packet ID
      const promise = this.#promises.get(parsed.id);
      if (!promise) return; // Promise not found -- ignore

      // Resolve the promise
      promise.resolve((parsed as IResponsePacket).result);

      // Remove the promise from the map
      this.#promises.delete(parsed.id);
    }
  }

  /**
   * Sets the remote message handler.
   * @param handler The remote message handler to set.
   */
  setRemoteMessageHandler(handler: IRemoteMessageHandler) {
    this.#remoteMessageHandler = handler;
  }

  /**
   * Sends a packet to the remote side.
   * @param packet The packet to send.
   */
  #sendPacket(packet: IPacket) {
    this.#log("Sending packet:", packet);

    // Convert packet to string and send it to the remote side (invoke it's message handler)
    const stringifiedPacket = JSON.stringify(packet);
    this.#remoteMessageHandler(stringifiedPacket);
  }

  /**
   * Parses and validates a packet.
   * @param data The packet to parse.
   * @returns Validated packet or an error message.
   */
  #parseAndValidatePacket(data: string): IPacket | string {
    try {
      // Parse JSON
      const parsedPacket = JSON.parse(data) as IPacket;

      // Check if packet type and kind are valid
      if (parsedPacket.type != EPacketType.RPCPacket) return "error:badID";
      if (
        parsedPacket.kind != EPacketKind.Call &&
        parsedPacket.kind != EPacketKind.Response &&
        parsedPacket.kind != EPacketKind.Error
      )
        return "error:badKind";

      // Check if packet id is valid
      if (!("id" in parsedPacket)) return "error:noId";
      if (typeof parsedPacket.id != "string") return "error:badId";

      // Check if packet has correct format
      if (parsedPacket.kind == EPacketKind.Error) {
        if (!("error" in parsedPacket)) return "error:noError";

        if (typeof parsedPacket.error?.message !== "string")
          return "error:badError";

        return parsedPacket;
      } else if (parsedPacket.kind == EPacketKind.Response) {
        if (!("result" in parsedPacket)) return "error:noResult";

        return parsedPacket;
      } else {
        if (!("args" in parsedPacket)) return "error:noArgs";

        if (typeof parsedPacket.name !== "string") return "error:badName";
        if (!Array.isArray(parsedPacket.args)) return "error:badArgs";
      }

      // Return parsed data if everything is ok
      return parsedPacket;
    } catch (err) {
      // Failed to parse JSON
      return "error:jsonParseError";
    }
  }

  /**
   * Invokes a local procedure.
   * @param name The name of the procedure to invoke.
   * @param args The arguments to pass to the procedure.
   * @returns Promise that resolves with the procedure result or an error.
   */
  async #invokeProcedure(name: string, args: any[]): Promise<Error | any> {
    // Get procedure from the map
    const procedure = this.#procedures.get(name);
    if (!procedure) return new Error("Procedure not found");

    // Invoke procedure and catch errors
    const result = await procedure(...args).catch((e) => {
      return new Error(e.message);
    });

    // Return result or error
    return result;
  }

  /**
   * Logs debug messages if debug mode is enabled.
   * @param data Data to log.
   */
  #log(...data: any[]) {
    if (!this.#debug) return;

    console.log("[RPC DEBUG]", ...data);
  }
}
