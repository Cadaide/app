export enum EPacketKind {
  Call = "call",
  Response = "response",
  Error = "error",
}

export enum EPacketType {
  RPCPacket = "rpc:packet",
}

export type IPacket = ICallPacket | IErrorPacket | IResponsePacket;

export interface ICallPacket {
  type: EPacketType;
  id: string;
  kind: EPacketKind.Call;
  name: string;
  args: any[];
}

export interface IResponsePacket {
  type: EPacketType;
  id: string;
  kind: EPacketKind.Response;
  result: any;
}

export interface IErrorPacket {
  type: EPacketType;
  id: string;
  kind: EPacketKind.Error;
  error: {
    message: string;
  };
}
