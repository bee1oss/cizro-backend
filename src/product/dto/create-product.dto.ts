import {
  IsArray,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsDecimal({ force_decimal: true, decimal_digits: '0,2' })
  price: string; // "199.99" şeklinde

  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  @IsString({ each: true })
  images: string[]; // URL’ler (S3 vs.)

  @IsString()
  categoryId: string;

  @IsString()
  storeId: string; // satıcının kendi mağazası olmalı (sahiplik kontrolü)
}
