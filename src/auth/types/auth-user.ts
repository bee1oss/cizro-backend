import { Role } from '@prisma/client';
export type AuthUser = {
  userId: string; // payload.sub
  id?: string; // legacy uyum için (opsiyonel)
  roles: Role[];
};
