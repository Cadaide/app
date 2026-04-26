import { Controller, Get, HttpCode, Query, Post } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('language')
  async detectProjectLanguage(@Query('path') path: string) {
    return this.projectService.detectProjectLanguage(path);
  }
}
