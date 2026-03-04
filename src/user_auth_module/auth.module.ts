// authentication module: central configuration for all authentication-related components
// integrate services, controllers, strategies, and guards for comprehensive user authentication
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// application layer components
import { AuthService } from './application/services/auth.service';
import { AuthController } from './interfaces/controllers/auth.controller';

// infrastructure layer components
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt_auth.guard';

// domain entities
import { PlatformUserEntity } from '../shared_module/entities/platform_universal_user.entity';

// JWT module configuration interface for type safety
interface JwtModuleConfig {
  secret: string; // JWT signing secret
  signOptions: {
    expiresIn: number; // token expiration in seconds
  };
}

// authentication module: configure and integrate all authentication components
// use global decorator to make authentication services available application-wide
@Global()
@Module({
  // import required modules for authentication functionality
  imports: [
    // configuration module for environment variable access
    ConfigModule,

    // TypeORM module for user entity database operations
    TypeOrmModule.forFeature([PlatformUserEntity]),

    // Passport module configured with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT module with async configuration for secure token handling
    JwtModule.registerAsync({
      imports: [ConfigModule], // import config for environment access
      useFactory: (configService: ConfigService): JwtModuleConfig => {
        // retrieve JWT configuration from environment variables
        const jwtSecret = configService.get<string>('JWT_SECRET_KEY');
        const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN', '24h');

        // validate critical configuration
        if (!jwtSecret) {
          throw new Error('JWT_SECRET_KEY environment variable is required');
        }

        // convert expiration time to seconds for JWT module
        const expiresInSeconds = jwtExpiresIn === '24h' ? 86400 : 604800; // 24h or 7d

        return {
          secret: jwtSecret, // JWT signing secret
          signOptions: {
            expiresIn: expiresInSeconds, // token expiration time
          },
        };
      },
      inject: [ConfigService], // inject config service for factory function
    }),
  ],

  // register controllers for API endpoint handling
  controllers: [AuthController],

  // register providers for dependency injection
  providers: [
    AuthService, // authentication business logic service
    JwtStrategy, // JWT token validation strategy
    JwtAuthGuard, // route protection guard
  ],

  // export providers for use in other modules
  exports: [
    AuthService, // export for user authentication operations
    JwtModule, // export for JWT token operations
    JwtAuthGuard, // export for route protection
  ],
})
export class AuthModule {
  
}