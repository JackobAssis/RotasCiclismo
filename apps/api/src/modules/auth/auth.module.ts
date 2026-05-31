/**
 * Auth Module
 *
 * Configures authentication: JWT strategy, auth service, auth controller.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../common/jwt.strategy';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from '../../config/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
    {
      provide: 'APP_CONFIG',
      useValue: loadConfig(),
    },
  ],
})
export class AuthModule {}
