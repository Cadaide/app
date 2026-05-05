import { HostRPC } from "../host/rpc";

export class CadaideHTTP {
  // TODO: Proper axios typing
  static async get<T>(url: string, options?: any) {
    const res = await HostRPC.instance.backend.callProcedure(
      "http.get",
      url,
      options,
    );

    return res as T;
  }
}
