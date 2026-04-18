import { Injectable, Logger } from '@nestjs/common';
import { RPCService } from 'src/services/RPC.service';

@Injectable()
export class FilesystemService {
  readonly #logger = new Logger(FilesystemService.name);

  constructor(private readonly rpcService: RPCService) {}

  async listDir(path: string) {
    const response = await this.rpcService.call('fs.listDir', { path });

    return response;
  }

  async readFile(path: string) {
    const response = await this.rpcService.call('fs.readFile', { path });

    return response;
  }

  async treeDir(path: string, depth: number) {
    const response = await this.rpcService.call('fs.treeDir', { path, depth });

    return response;
  }

  async writeFile(path: string, content: string) {
    const response = await this.rpcService.call('fs.writeFile', {
      path,
      content,
    });

    return response;
  }

  async stat(path: string) {
    const response = await this.rpcService.call('fs.stat', { path });

    return response;
  }

  async mkdir(path: string) {
    const response = await this.rpcService.call('fs.mkdir', { path });

    return response;
  }

  async rm(path: string) {
    const response = await this.rpcService.call('fs.rm', { path });

    return response;
  }

  async mv(path: string, dest: string) {
    const response = await this.rpcService.call('fs.mv', { path, dest });

    return response;
  }
}
