import { Controller } from '@nestjs/common';
import { StoreUserService } from './store-user.service';

@Controller('store-user')
export class StoreUserController {
  constructor(private readonly storeUserService: StoreUserService) {}
}
