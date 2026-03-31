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
}
