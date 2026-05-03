# @cadaide/rpc

A lightweight, promise-based Remote Procedure Call (RPC) library designed for the Cadaide editor.

This package facilitates seamless cross-environment communication by allowing you to register procedures on one side and call them asynchronously from the other. It utilizes a simple string-based message passing system, making it ideal for WebWorkers, IFrames, WebSockets, or any other isolated environments, like `@cadaide/plugin-vm` in our case.

## Installation

```bash
bun add @cadaide/rpc
```

```typescript
import { RPC } from "@cadaide/rpc";
```

## Usage

To use the RPC library, you need two instances of `RPC` communicating with each other. You must configure how they send messages to one another and pass received messages into the instances.

### Example

**Side A (e.g., Host)**

```typescript
import { RPC } from "@cadaide/rpc";

const rpcA = new RPC(true, 5000); // true enables debug logging, 5000ms is the timeout

// 1. Setup sending messages to Side B
rpcA.setRemoteMessageHandler((message: string) => {
  // Send the stringified message to Side B
  // e.g. worker.postMessage(message)
  sendToSideB(message);
});

// 2. Setup receiving messages from Side B
function onMessageFromSideB(message: string) {
  rpcA.handleRemoteMessage(message);
}

// 3. Register a procedure for Side B to call
rpcA.registerProcedure("greet", async (name: string) => {
  return `Hello, ${name}, from Side A!`;
});
```

**Side B (e.g. Worker/Plugin)**

```typescript
import { RPC } from "@cadaide/rpc";

const rpcB = new RPC();

// 1. Setup sending messages to Side A
rpcB.setRemoteMessageHandler((message: string) => {
  // Send the stringified message to Side A
  // e.g. parent.postMessage(message)
  sendToSideA(message);
});

// 2. Setup receiving messages from Side A
function onMessageFromSideA(message: string) {
  rpcB.handleRemoteMessage(message);
}

// 3. Call a procedure on Side A
async function run() {
  try {
    const greeting = await rpcB.callProcedure<string>("greet", "Joe");

    console.log(greeting); // "Hello, Joe, from Side A!"
  } catch (error) {
    console.error("RPC Call failed:", error);
  }
}

run();
```

## API Reference

### `class RPC`

#### `constructor(debug?: boolean, timeout: number = 10000)`

Creates a new instance of the RPC class.

- `debug`: If `true`, logs debug messages to the console.
- `timeout`: Default timeout for RPC calls in milliseconds. Defaults to `10000` (10 seconds).

#### `setRemoteMessageHandler(handler: IRemoteMessageHandler)`

Registers the callback responsible for transmitting a stringified packet to the remote side.

- `handler`: A function `(message: string) => void`.

#### `handleRemoteMessage(message: string)`

Passes an incoming message from the remote side into the RPC instance for processing.

- `message`: The raw JSON string received from the remote side.

#### `registerProcedure(name: string, procedure: IProcedure)`

Registers a local procedure that can be invoked by the remote side.

- `name`: The unique identifier for the procedure.
- `procedure`: An async function `(...args: any[]) => Promise<unknown>`.

#### `callProcedure<T>(name: string, ...args: any[]): Promise<T>`

Invokes a registered procedure on the remote side and waits for the response.

- `name`: The unique identifier of the remote procedure.
- `args`: Arguments to pass to the procedure.
- Returns: A promise resolving to the expected return type `T`. Throws an error on timeout or if the remote side rejects the call.

## Internal Mechanics

1. `callProcedure` generates a unique UUID for the call, constructs a packet (`IPacket`) of kind `call`, and sends it via the function registered in `setRemoteMessageHandler`.
2. The remote side receives the string, parses it using `handleRemoteMessage`, executes the registered procedure matching the `name`, and replies with either a `response` or `error` packet utilizing the same UUID.
3. The originating side intercepts the response in `handleRemoteMessage`, correlates the UUID with the pending promise, and resolves or rejects it accordingly.

## Security

This library does not perform any security checks on the incoming messages. It is up to the developer to ensure that the remote side is trustworthy.

## Encoding

This library communicates using UTF-8 encoded JSON strings. If you are using any channel that does not support UTF-8, you will need to encode/decode the messages yourself.

# License

MIT
