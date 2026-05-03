import WebSocket from "ws";
import { RPC } from "../src";

const ws = new WebSocket("ws://localhost:7593");

ws.on("open", async () => {
  const rpc = new RPC(true);

  rpc.registerProcedure("addTwo", async (a: number, b: number) => {
    return a + b;
  });

  rpc.setRemoteMessageHandler((msg: string) => ws.send(msg));
  ws.on("message", (msg) => rpc.handleRemoteMessage(msg.toString("utf-8")));

  const res = await rpc.callProcedure("addThree", 10, 5, 1);
  console.log(res);
});
