import { RPC } from '@cadaide/rpc';

interface IVMOptions {
    codeRootPath: string;
    entrypoint: string;
    limits: {
        memoryMB: number;
    };
}
declare class VM {
    #private;
    constructor(rpcs: Record<string, RPC>, options: IVMOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    run(): Promise<void>;
}

export { type IVMOptions, VM };
