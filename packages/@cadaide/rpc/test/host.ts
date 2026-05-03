import { WebSocketServer } from "ws";
import { RPC } from "../src";

const wss = new WebSocketServer({
  port: 7593,
});

wss.on("connection", (client) => {
  const rpc = new RPC(true);

  rpc.registerProcedure("addThree", async (a: number, b: number, c: number) => {
    const ab = await rpc.callProcedure("addTwo", a, b);
    const abc = await rpc.callProcedure("addTwo", ab, c);

    return abc;
  });

  client.on("message", (msg) => rpc.handleRemoteMessage(msg.toString("utf-8")));
  rpc.setRemoteMessageHandler((msg: string) => client.send(msg));
});
