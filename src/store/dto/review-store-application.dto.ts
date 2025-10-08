import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewStoreApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectReason?: string;
}
