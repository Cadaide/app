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
  #debug?: boolean;

  #remoteMessageHandler: IRemoteMessageHandler = () => {};
  #procedures: Map<string, IProcedure> = new Map();
  #promises: Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  constructor(debug?: boolean) {
    this.#debug = debug;
  }

  #log(...data: any[]) {
    if (!this.#debug) return;

    console.log("[RPC DEBUG]", ...data);
  }

  registerProcedure(name: string, procedure: IProcedure) {
    this.#log("Registering procedure:", name);

    this.#procedures.set(name, procedure);
  }

  async callProcedure<T>(name: string, ...args: any[]): Promise<T> {
    this.#log("Calling procedure:", name, args);

    const packet: IPacket = {
      type: EPacketType.RPCPacket,
      id: v4(),
      kind: EPacketKind.Call,
      name,
      args,
    };

    this.#sendPacket(packet);

    return new Promise<T>((resolve, reject) => {
      const timeoutPromise = setTimeout(() => {
        this.#promises.delete(packet.id);
        reject(new Error("Timeout"));
      }, 10000);

      const whenDone = (value: any) => {
        clearTimeout(timeoutPromise);
        resolve(value);
      };

      const whenError = (error: Error) => {
        clearTimeout(timeoutPromise);
        reject(error);
      };

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
    const parsed = this.#parseAndValidatePacket(message);
    if (typeof parsed == "string") {
      this.#log("Throwing out invalid packet:", parsed);

      return;
    }

    this.#log("Got remote packet:", parsed);

    if (parsed.kind == EPacketKind.Call) {
      const result = await this.#invokeProcedure(parsed.name, parsed.args);
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

      this.#sendPacket({
        type: EPacketType.RPCPacket,
        id: parsed.id,
        kind: EPacketKind.Response,
        result: result,
      });
    } else if (parsed.kind == EPacketKind.Error) {
      this.#log("Got error:", (parsed as IErrorPacket).error.message);

      const promise = this.#promises.get(parsed.id);
      if (!promise) return;

      promise.reject(new Error((parsed as IErrorPacket).error.message));
      this.#promises.delete(parsed.id);
    } else if (parsed.kind == EPacketKind.Response) {
      this.#log("Got response:", parsed);

      const promise = this.#promises.get(parsed.id);
      if (!promise) return;

      promise.resolve((parsed as IResponsePacket).result);
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

    const stringifiedPacket = JSON.stringify(packet);

    this.#remoteMessageHandler(stringifiedPacket);
  }

  #parseAndValidatePacket(data: string): IPacket | string {
    try {
      const parsedPacket = JSON.parse(data) as IPacket;

      if (parsedPacket.type != EPacketType.RPCPacket) return "error:badID";
      if (
        parsedPacket.kind != EPacketKind.Call &&
        parsedPacket.kind != EPacketKind.Response &&
        parsedPacket.kind != EPacketKind.Error
      )
        return "error:badKind";

      if (!("id" in parsedPacket)) return "error:noId";
      if (typeof parsedPacket.id != "string") return "error:badId";

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

      return parsedPacket;
    } catch (err) {
      return "error:jsonParseError";
    }
  }

  async #invokeProcedure(name: string, args: any[]): Promise<Error | any> {
    const procedure = this.#procedures.get(name);
    if (!procedure) return new Error("Procedure not found");

    const result = await procedure(...args).catch((e) => {
      return new Error(e.message);
    });

    return result;
  }
}
