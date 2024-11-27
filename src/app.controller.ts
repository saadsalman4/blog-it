import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/login', 302) // Redirect to /login with HTTP status 302 (Found)
  handleRoot() {
    return;
  }
}
