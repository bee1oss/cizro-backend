import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  // alt kategori olusturmak için parentId gonder
  @IsOptional()
  @IsString()
  parentId?: string;
}
