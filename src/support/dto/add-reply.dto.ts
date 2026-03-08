import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
