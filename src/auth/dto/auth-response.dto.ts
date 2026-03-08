// Auth yanıtı için DTO
export class AuthResponseDto {
  accessToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: number;
}
