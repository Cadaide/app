import { Body, Controller, Post } from '@nestjs/common';
import { ShellService } from './shell.service';

@Controller('/shell')
export class ShellController {
  constructor(private readonly shellService: ShellService) {}

  @Post('/')
  async run(
    @Body('command') command: string[],
    @Body('options') options: Record<string, any>,
  ) {
    return await this.shellService.run(command, options);
  }
}
