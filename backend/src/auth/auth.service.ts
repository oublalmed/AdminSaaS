import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto, LoginDto, AddUserDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        ice: dto.ice,
        rc: dto.rc,
        phone: dto.phone,
        city: dto.city,
        country: dto.country || 'MA',
        email: dto.email,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role, tenant.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Track last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(
      user.id,
      user.email,
      user.role,
      user.tenantId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
      },
      token,
    };
  }

  // Switch active tenant (for fiduciary users managing multiple companies)
  async switchTenant(userId: string, currentTenantId: string, targetTenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException();

    if (targetTenantId !== user.tenantId) {
      const access = await this.prisma.userTenantAccess.findUnique({
        where: { userId_tenantId: { userId, tenantId: targetTenantId } },
      });
      if (!access) throw new ForbiddenException('Acces non autorise a ce tenant');
    }

    const targetTenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
    });
    if (!targetTenant || !targetTenant.isActive) {
      throw new ForbiddenException('Tenant inactif ou introuvable');
    }

    const token = this.generateToken(userId, user.email, user.role, targetTenantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: targetTenant.id,
        name: targetTenant.name,
        ice: targetTenant.ice,
        rc: targetTenant.rc,
        currency: targetTenant.currency,
        tvaRate: targetTenant.tvaRate,
      },
      token,
    };
  }

  async addUser(dto: AddUserDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        tenantId,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException();

    const managedTenantCount = await this.prisma.userTenantAccess.count({
      where: { userId },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isMultiTenant: managedTenantCount > 0,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        ice: user.tenant.ice,
        rc: user.tenant.rc,
        currency: user.tenant.currency,
        tvaRate: user.tenant.tvaRate,
      },
    };
  }

  private generateToken(
    userId: string,
    email: string,
    role: string,
    tenantId: string,
  ): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
      tenantId,
    });
  }
}
