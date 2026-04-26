import { Module } from '@nestjs/common';
import { FilesystemController } from './filesystem.controller';
import { FilesystemService } from './filesystem.service';
import { RPC_BINARY, RPCService } from 'src/services/RPC.service';

@Module({
  imports: [],
  controllers: [FilesystemController],
  providers: [
    {
      provide: RPC_BINARY,
      useValue: process.env.FS_BINARY_PATH,
    },
    RPCService,
    FilesystemService,
  ],
  exports: [FilesystemService],
})
export class FilesystemModule {}
