import { Module } from '@nestjs/common';
import { LspService } from './lsp.service';
import { LspGateway } from './lsp.gateway';

@Module({
  imports: [],
  providers: [LspService, LspGateway],
})
export class LspModule {}
