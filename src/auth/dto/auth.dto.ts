import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsOptional()
  @IsString()
  fullName: string;

  @IsString({
    message: 'mail is required',
  })
  @IsEmail()
  email: string;

  @MinLength(6, {
    message: 'password must contain at least 6 characters',
  })
  @IsString({
    message: 'password is required',
  })
  password: string;

  @IsOptional()
  @IsString({
    message: 'phone number is required',
  })
  phone: string;
}
