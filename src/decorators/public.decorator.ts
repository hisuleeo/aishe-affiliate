import { SetMetadata } from '@nestjs/common';

// Public endpointleri global guard'dan muaf tutar
export const Public = () => SetMetadata('isPublic', true);
