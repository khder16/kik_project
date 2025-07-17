import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';



@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) { }



  @Get('csrf-token')
  getCsrfToken(@Req() req: Request): { token: string } {
    return { token: (req as any).csrfToken() };
  }


}
