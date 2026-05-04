type IProcedure = (...args: any[]) => Promise<unknown>;

type IRemoteMessageHandler = (message: string) => void;

declare class RPC {
    #private;
    /**
     * Creates a new instance of the RPC class.
     * @param debug If true, log debug messages.
     * @param timeout Default timeout for RPC calls in milliseconds.
     */
    constructor(debug?: boolean, timeout?: number);
    /**
     * Registers a procedure to be invoked by the remote side.
     * @param name Procedure name.
     * @param procedure Procedure function.
     */
    registerProcedure(name: string, procedure: IProcedure): void;
    /**
     * Invokes a procedure on the remote side and waits for the response.
     * @param name Procedure name.
     * @param args Procedure arguments.
     * @returns Promise that resolves with the procedure result.
     * @throws Error if the procedure is not registered on the remote side, the remote side throws an error or the call times out.
     */
    callProcedure<T>(name: string, ...args: any[]): Promise<T>;
    /**
     * Handles a remote message.
     * @param message The remote message to handle.
     */
    handleRemoteMessage(message: string): Promise<void>;
    /**
     * Sets the remote message handler.
     * @param handler The remote message handler to set.
     */
    setRemoteMessageHandler(handler: IRemoteMessageHandler): void;
}

export { RPC };
