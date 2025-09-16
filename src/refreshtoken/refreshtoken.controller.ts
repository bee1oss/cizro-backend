import { Controller } from '@nestjs/common';
import { RefreshtokenService } from './refreshtoken.service';

@Controller('refreshtoken')
export class RefreshtokenController {
  constructor(private readonly refreshtokenService: RefreshtokenService) {}
}
