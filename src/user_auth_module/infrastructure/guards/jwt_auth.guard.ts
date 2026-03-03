// JWT authentication guard: the JWT strategies based on Passport, used for protecting routes that require authentication, validate JWT tokens in incoming requests, and attach user information to the request object for further processing in controllers and services
import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";

/**
 * JWT Authentication Guard
 *
 * Extends Passport's JWT strategy-based AuthGuard to protect routes requiring authentication.
 * Validates JWT tokens in incoming requests and attaches authenticated user information
 * to the request object. Supports public routes that bypass authentication via metadata.
 *
 * Key features:
 * - Automatic JWT token validation
 * - Public route support via @Public() decorator
 * - Custom error handling for unauthorized access
 * - Type-safe user object attachment
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * Constructor with dependency injection
     *
     * @param reflector - NestJS Reflector for accessing route metadata
     */
    constructor(private reflector: Reflector) {
        super();
    }

    /**
     * Main guard method: determines if request can proceed
     *
     * Checks for public route metadata first. If route is public, allows access without
     * authentication. Otherwise, proceeds with JWT token validation.
     *
     * @param context - Execution context containing request details
     * @returns Promise resolving to boolean indicating access permission
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public using custom metadata
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        try {
            // Proceed with JWT authentication
            return await super.canActivate(context) as boolean;
        } catch (error) {
            throw new UnauthorizedException('Unauthorized access, please login again or register');
        }
    }

    /**
     * Handle authentication result
     *
     * Processes the result of JWT authentication. Throws UnauthorizedException
     * for authentication failures, otherwise returns the authenticated user.
     *
     * @param error - Authentication error if any
     * @param user - Authenticated user object or false
     * @param info - Additional authentication info
     * @param context - Execution context
     * @param status - Optional status code
     * @returns Authenticated user object
     * @throws UnauthorizedException for authentication failures
     */
    handleRequest(
        error: any,
        user: any,
        info?: any,
        context?: ExecutionContext,
        status?: any
    ): any {
        if (error || !user) {
            throw new UnauthorizedException('Unauthorized access, please login again or register');
        }
        return user;
    }
}