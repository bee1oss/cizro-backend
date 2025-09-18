import { IsString } from 'class-validator';

export class ColorDto {
  @IsString({
    message: 'name is necessarily',
  })
  name: string;

  @IsString({
    message: 'value is necessarily',
  })
  value: string;
}
