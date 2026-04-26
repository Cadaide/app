import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { FilesystemModule } from '../filesystem/filesystem.module';

@Module({
  imports: [FilesystemModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
