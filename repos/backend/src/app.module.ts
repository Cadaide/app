import { Module } from '@nestjs/common';
import { FilesystemModule } from './routes/filesystem/filesystem.module';

@Module({
  imports: [FilesystemModule],
})
export class AppModule {}
