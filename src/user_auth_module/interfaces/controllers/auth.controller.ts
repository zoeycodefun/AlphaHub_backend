// authentication controller: handle API routers and requests of user authentication, including registration and login
// used for receiving HTTP requests, API, and return HTTP responses
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../../application/dtos/register.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt_auth.guard';
import { PlatformUserEntity } from '../../../shared_module/entities/platform_universal_user.entity';

/**
 * Base authentication response interface
 *
 * Provides consistent structure for all authentication API responses.
 */
interface BaseAuthResponse {
    success: boolean;
    message: string;
    timestamp: string;
}

/**
 * Authentication response with optional data payload
 *
 * Generic interface for responses containing data.
 */
interface AuthResponse<T = Record<string, never>> extends BaseAuthResponse {
    data?: T; // Optional response data with generic typing
}

/**
 * Login response data structure
 */
interface LoginResponseData {
    accessToken: string; // JWT access token for authenticated requests
    user: Omit<PlatformUserEntity, 'password'>; // User information excluding sensitive data
    expiresIn: string; // Token expiration description
}

/**
 * Register response data structure
 */
interface RegisterResponseData {
    user: Omit<PlatformUserEntity, 'password'>; // Registered user information
}

/**
 * Profile response data structure
 */
interface ProfileResponseData {
    user: Omit<PlatformUserEntity, 'password'>; // Current user profile information
}

/**
 * Verification response data structure
 */
interface VerificationResponseData {
    valid: boolean; // Token validity status
}

/**
 * Authentication Controller
 *
 * Handles all authentication-related API endpoints including user registration,
 * login, profile retrieval, and token verification. Implements RESTful routes
 * with proper HTTP status codes and consistent response formatting.
 *
 * Key features:
 * - User registration and login endpoints
 * - JWT-protected profile and verification routes
 * - Consistent error handling and response formatting
 * - Type-safe request/response handling
 */
@Controller('auth')
export class AuthController {
    /**
     * Constructor with dependency injection
     *
     * @param authService - Authentication service for business logic
     */
    constructor(private readonly authService: AuthService) {}

    /**
     * User registration endpoint
     *
     * Creates a new user account with validated registration data.
     *
     * @param registerDto - Validated registration data from request body
     * @returns Promise resolving to registration success response
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponse<RegisterResponseData>> {
        try {
            // Delegate registration logic to service layer
            const user = await this.authService.register(registerDto);

            // Return successful registration response
            return {
                success: true,
                message: 'User registration successful',
                data: {
                    user,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            // Re-throw service layer exceptions for global error handling
            throw error;
        }
    }

    /**
     * User login endpoint
     *
     * Authenticates user credentials and issues JWT access token.
     *
     * @param loginDto - Validated login credentials from request body
     * @returns Promise resolving to login success response with token
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthResponse<LoginResponseData>> {
        try {
            // Delegate authentication logic to service layer
            const result = await this.authService.login(loginDto);

            // Determine expiration description based on remember me flag
            const expiresIn = loginDto.rememberMe ? '7 days' : '24 hours';

            // Return successful login response with token and user data
            return {
                success: true,
                message: 'User login successful',
                data: {
                    accessToken: result.accessToken,
                    user: result.user,
                    expiresIn,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            // Re-throw service layer exceptions for global error handling
            throw error;
        }
    }

    /**
     * Get current user profile endpoint
     *
     * Retrieves the authenticated user's profile information.
     * Requires valid JWT token (protected by JwtAuthGuard).
     *
     * @param req - Request object with authenticated user attached by guard
     * @returns Promise resolving to user profile response
     */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req: { user: Omit<PlatformUserEntity, 'password'> }): Promise<AuthResponse<ProfileResponseData>> {
        try {
            // User information is attached to request by JWT guard
            const user = req.user;

            // Return current user profile information
            return {
                success: true,
                message: 'User profile retrieved successfully',
                data: {
                    user,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            // Re-throw exceptions for global error handling
            throw error;
        }
    }

    /**
     * Verify token endpoint
     *
     * Checks if the current JWT token is valid.
     * Requires valid JWT token (protected by JwtAuthGuard).
     *
     * @returns Promise resolving to token verification response
     */
    @UseGuards(JwtAuthGuard)
    @Get('verify')
    async verifyToken(): Promise<AuthResponse<VerificationResponseData>> {
        try {
            // If request reaches this point, token is valid (guard would reject otherwise)
            return {
                success: true,
                message: 'Token verification successful',
                data: {
                    valid: true,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            // Re-throw exceptions for global error handling
            throw error;
        }
    }
}