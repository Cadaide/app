import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';

interface FsMicroservice {
  listDir(data: { path: string }): Promise<{
    entries: {
      name: string;
      path: string;
      type: string;
    }[];
  }>;
  readFile(data: { path: string }): Promise<{
    content: string;
  }>;
  treeDir(data: { path: string; depth: number }): Promise<{
    entries: {
      name: string;
      path: string;
      type: string;
    };
  }>;
  writeFile(data: { path: string; content: string }): Promise<{}>;
}

@Injectable()
export class FilesystemService implements OnModuleInit {
  private fsMicroservice: FsMicroservice;

  constructor(@Inject('FS_SERVICE') private readonly fsClient: ClientGrpc) {}

  onModuleInit() {
    this.fsMicroservice = this.fsClient.getService<FsMicroservice>('FsService');
  }

  async listDir(path: string) {
    const response = await this.fsMicroservice.listDir({ path });

    return response;
  }

  async readFile(path: string) {
    const response = await this.fsMicroservice.readFile({ path });

    return response;
  }

  async treeDir(path: string, depth: number) {
    const response = await this.fsMicroservice.treeDir({ path, depth });

    return response;
  }

  async writeFile(path: string, content: string) {
    const response = await this.fsMicroservice.writeFile({ path, content });

    return response;
  }
}
