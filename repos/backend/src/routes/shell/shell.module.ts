import { Module } from '@nestjs/common';
import { ShellController } from './shell.controller';
import { ShellService } from './shell.service';
import { ShellGateway } from './shell.gateway';

@Module({
  imports: [],
  controllers: [ShellController],
  providers: [ShellService, ShellGateway],
})
export class ShellModule {}
