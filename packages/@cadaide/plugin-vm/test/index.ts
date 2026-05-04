import { RPC } from "@cadaide/rpc";
import { VM } from "../src/classes/VM";

const frontendRpc = new RPC(false);
const backendRpc = new RPC(false);
const vm = new VM(
  {
    frontend: frontendRpc,
    backend: backendRpc,
  },
  {
    limits: {
      memoryMB: 128,
    },
    codeRootPath: process.cwd(),
    entrypoint: "test/vmcode.ts",
  },
);

frontendRpc.registerProcedure(
  "notifications.show",
  async ({ type, message }: any) => {
    console.log(type, message);

    return true;
  },
);

await vm.initialize();
await vm.run();
