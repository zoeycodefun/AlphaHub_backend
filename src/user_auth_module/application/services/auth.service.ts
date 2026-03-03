// authentication service: handle user registration, login, password validation, JWT token generation and refresh logic
// obey SOLID principles, use dependency injection
import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { PlatformUserEntity } from "@/shared_module/entities/platform_universal_user.entity";
import { RegisterDto } from "../dtos/register.dto";
import { LoginDto } from "../dtos/login.dto";

/**
 * JWT payload interface
 *
 * Defines the structure of user information stored in JWT tokens.
 * Used for authentication and authorization throughout the platform.
 */
export interface JwtPayload {
    userId: string;
    email: string;
    /** Issued at timestamp (optional, set by JWT library) */
    iat?: number;
    /** Expiration timestamp (optional, set by JWT library) */
    exp?: number;
}

/**
 * Authentication service
 *
 * Core service handling user authentication operations including registration,
 * login, password validation, and JWT token management. Implements secure
 * password hashing, token generation, and user validation logic.
 */
@Injectable()
export class AuthService {
    /**
     * Constructor with dependency injection
     *
     * @param userRepository - TypeORM repository for PlatformUserEntity
     * @param jwtService - NestJS JWT service for token operations
     */
    constructor(
        @InjectRepository(PlatformUserEntity)
        private readonly userRepository: Repository<PlatformUserEntity>,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * User registration method
     *
     * Handles complete user registration process including email uniqueness
     * validation, secure password hashing, and database persistence.
     *
     * @param registerDto - Validated registration data from client
     * @returns Promise resolving to created user entity (without password)
     * @throws ConflictException if email already exists
     * @throws BadRequestException for invalid data (handled by DTO validation)
     */
    async register(registerDto: RegisterDto): Promise<PlatformUserEntity> {
        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email is already in use');
        }

        // Hash password with secure salt rounds
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

        // Generate username from nickname or email prefix
        const username = registerDto.nickname || registerDto.email.split('@')[0];

        // Create new user entity with all required fields
        const newUser = this.userRepository.create({
            email: registerDto.email,
            password: hashedPassword,
            username: username,
            nickname: registerDto.nickname || null,
            role: 'user',
            enabled: true,
            emailVerified: false,
            phoneVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Save user to database
        const savedUser = await this.userRepository.save(newUser);

        // Return user without sensitive password field
        const { password, ...userWithoutPassword } = savedUser;
        return userWithoutPassword as PlatformUserEntity;
    }

    /**
     * User login method
     *
     * Validates user credentials and generates JWT access token with
     * configurable expiration based on remember me preference.
     *
     * @param loginDto - Validated login credentials from client
     * @returns Promise resolving to access token and user info
     * @throws UnauthorizedException for invalid credentials or disabled account
     */
    async login(loginDto: LoginDto): Promise<{ accessToken: string; user: PlatformUserEntity }> {
        // Find user by email
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if account is enabled
        if (!user.enabled) {
            throw new UnauthorizedException('Account is disabled, please contact administrator');
        }

        // Determine token expiration based on remember me flag
        const expiresIn = loginDto.rememberMe ? '7d' : '24h';

        // Create JWT payload
        const payload: JwtPayload = {
            userId: user.id.toString(),
            email: user.email || '',
        };

        // Generate and sign JWT token
        const accessToken = this.jwtService.sign(payload, { expiresIn });

        // Return token and user info without password
        const { password, ...userWithoutPassword } = user;
        return {
            accessToken,
            user: userWithoutPassword as PlatformUserEntity,
        };
    }

    /**
     * Validate user by ID
     *
     * Used by JWT strategy to validate user existence and status.
     * Returns null for non-existent or disabled users.
     *
     * @param userId - User ID as string from JWT payload
     * @returns Promise resolving to user entity or null
     */
    async validateUser(userId: string): Promise<PlatformUserEntity | null> {
        // Parse userId to number for database query
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            return null;
        }

        // Find user by ID
        const user = await this.userRepository.findOne({
            where: { id },
        });

        // Return null if user not found or disabled
        if (!user || !user.enabled) {
            return null;
        }

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as PlatformUserEntity;
    }
}
