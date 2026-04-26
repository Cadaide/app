import { Controller } from '@nestjs/common';
import { WindowService } from './window.service';

@Controller('/window')
export class WindowController {
  constructor(private readonly windowService: WindowService) {}
}
