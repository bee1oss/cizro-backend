import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty() fullName: string;
  @IsEmail() email: string;
  @MinLength(6) password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
