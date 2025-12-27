import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  // kategoriyi başka bir ebeveyn altina tasimak istersen
  @IsOptional()
  @IsString()
  parentId?: string | null; // null => kok kategori yap
}
