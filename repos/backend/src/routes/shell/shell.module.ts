import { Module } from '@nestjs/common';
import { ShellController } from './shell.controller';
import { ShellService } from './shell.service';

@Module({
  imports: [],
  controllers: [ShellController],
  providers: [ShellService],
})
export class ShellModule {}
