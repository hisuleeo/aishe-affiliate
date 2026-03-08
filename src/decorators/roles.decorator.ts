import { SetMetadata } from '@nestjs/common';

// Rol bazlı erişim için decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
