import { IsString } from 'class-validator';

export class CategoryDto {
  @IsString({
    message: 'title is necessarily',
  })
  title: string;

  @IsString({
    message: 'description is necessarily',
  })
  description: string;
}
