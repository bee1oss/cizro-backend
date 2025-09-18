import { IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString({
    message: 'Name is necessarily',
  })
  title: string;
}
