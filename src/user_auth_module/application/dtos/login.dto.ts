// users login data transfer object: define the data structure for user login, including validation rules and transformation if needed
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Users login request data transfer object (DTO)
 *
 * This DTO is used for validating and transforming user login data from client requests
 * before processing in the service layer. It follows RESTful API design principles and
 * implements comprehensive validation to ensure data integrity and security.
 *
 * Key features:
 * - Email normalization (lowercase, trimmed)
 * - Strong password requirements
 * - Optional remember me functionality
 * - Type-safe validation with class-validator
 */
export class LoginDto {
    /**
     * User's email address
     *
     * - Must be a valid email format
     * - Required field
     * - Automatically transformed to lowercase and trimmed
     */
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    email: string;

    /**
     * User's password
     *
     * - Must be a string
     * - Required field
     * - Length between 8 and 128 characters
     * - Must contain at least one uppercase letter, one lowercase letter, one number, and one special character
     */
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @Length(8, 128, { message: 'Password must be between 8 and 128 characters long' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
    )
    password: string;

    /**
     * Remember me option for login
     *
     * - Optional field (defaults to false)
     * - Controls JWT token expiration time
     * - If true: token expires in 7 days
     * - If false: token expires in 24 hours
     */
    @IsOptional()
    @IsBoolean({ message: 'Remember me must be a boolean value' })
    rememberMe?: boolean = false;
}

