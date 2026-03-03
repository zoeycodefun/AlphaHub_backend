// JWT strategy: implement Passport JWT strategy for token validation and user extraction
// handle JWT token verification, payload decoding, and user authentication
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../../application/services/auth.service';
import { PlatformUserEntity } from '../../../shared_module/entities/platform_universal_user.entity';

/**
 * JWT Strategy for Passport Authentication
 *
 * Implements Passport's JWT strategy to validate JWT tokens and extract authenticated
 * user information. Handles token verification, payload decoding, and user validation
 * against the database.
 *
 * Key features:
 * - Secure JWT token validation with configurable secret
 * - User existence and status verification
 * - Email consistency checks between token and database
 * - Type-safe payload handling
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    /**
     * Constructor with dependency injection
     *
     * Configures the JWT strategy with environment-based settings and secure defaults.
     * Validates critical configuration parameters on initialization.
     *
     * @param configService - NestJS config service for environment variables
     * @param authService - Authentication service for user validation
     * @throws Error if JWT_SECRET_KEY is not configured
     */
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        // Retrieve JWT secret from environment configuration
        const jwtSecret = configService.get<string>('JWT_SECRET_KEY');

        // Validate critical configuration
        if (!jwtSecret) {
            throw new Error('JWT_SECRET_KEY environment variable is required for JWT strategy');
        }

        // Configure JWT strategy options with secure defaults
        const strategyOptions: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            algorithms: ['HS256'],
        };

        // Call parent constructor with configuration
        super(strategyOptions);
    }

    /**
     * Validate JWT payload and authenticate user
     *
     * Called by Passport after successful token verification. Validates payload structure,
     * checks user existence and status, and ensures email consistency.
     *
     * @param payload - Decoded JWT payload containing user information
     * @returns Promise resolving to validated user entity (without password)
     * @throws UnauthorizedException for invalid payload, non-existent user, or email mismatch
     */
    async validate(payload: JwtPayload): Promise<Omit<PlatformUserEntity, 'password'>> {
        // Validate payload structure and required fields
        if (!payload.userId || !payload.email) {
            throw new UnauthorizedException('Invalid JWT payload: missing required user information');
        }

        // Validate user existence and account status
        const user = await this.authService.validateUser(payload.userId);
        if (!user) {
            throw new UnauthorizedException('User not found or account disabled');
        }

        // Validate email consistency between token and database
        if (user.email !== payload.email) {
            throw new UnauthorizedException('Token email mismatch: please re-authenticate');
        }

        // Return validated user information (password already excluded by service)
        return user;
    }
}