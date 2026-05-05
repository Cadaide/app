export class RPCForwarder {
  #remoteMessageHandler: (msg: string) => void;
  #localMessageHandler: (msg: string) => void;

  constructor() {}

  // Here, we get the function that is used to send the message through the socket
  provideMessageSender(handler: (msg: string) => void) {
    this.#localMessageHandler = handler;
  }

  // This is used for the socket to send messages to the RPC
  handleIncomingMessage(msg: string) {
    this.#remoteMessageHandler(msg);
  }

  // Here, we get the RPC handler that is used to send the message through the RPC
  setRemoteMessageHandler(handler: (msg: string) => void) {
    this.#remoteMessageHandler = handler;
  }

  // This is used for the RPC to send messages to the socket
  handleRemoteMessage(msg: string) {
    this.#localMessageHandler(msg);
  }
}
