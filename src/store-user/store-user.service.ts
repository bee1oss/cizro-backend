import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StoreUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const storeuser = await this.prisma.storeuser.findUnique({
      where: {
        id,
      },
      include: {
        stores: true,
      },
    });
    return storeuser;
  }

  async getByEmail(email: string) {
    const storeuser = await this.prisma.storeuser.findUnique({
      where: {
        email,
      },
      include: {
        stores: true,
      },
    });
    return storeuser;
  }

  async create(dto: AuthDto) {
    return this.prisma.storeuser.create({
      data: {
        fullname: dto.fullName,
        email: dto.email,
        passwd: await hash(dto.passwd),
        phone: dto.phone,
      },
    });
  }

  async validatePassword(plainPass: string, hashedPass: string): Promise<boolean> {
    return await verify(hashedPass, plainPass);
  }
}
