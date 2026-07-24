import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

type SupportHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class CreateSupportRequestDto {
  @IsString()
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  lang?: string;

  @IsOptional()
  @IsObject()
  userContext?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };

  @IsOptional()
  history?: SupportHistoryMessage[];
}
