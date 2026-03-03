// users registration data transfer object: define the data structure for user registration, including validation rules and transformation if needed
// ensure the data integrity and security of user registration data, and provide a clear contract for the client to follow when sending registration requests
import { IsEmail, IsNotEmpty, IsString, Length, Matches, IsOptional, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Transform } from "class-transformer";

/**
 * Custom validator constraint to ensure password and confirm password match.
 *
 * This validator is used in RegisterDto to validate that the confirmPassword field
 * matches the password field, enhancing user experience by providing clear validation
 * rules and error messages for password confirmation during registration.
 */
@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class IsPasswordMatchingConstraint implements ValidatorConstraintInterface {
    /**
     * Validates that confirmPassword matches the password field.
     *
     * @param confirmPassword - The confirm password value to validate
     * @param args - Validation arguments containing the object context
     * @returns true if passwords match, false otherwise
     */
    validate(confirmPassword: string, args: ValidationArguments): boolean {
        const object = args.object as { password: string };
        return confirmPassword === object.password;
    }

    /**
     * Returns the default error message for password mismatch.
     *
     * @param args - Validation arguments
     * @returns Error message string
     */
    defaultMessage(args: ValidationArguments): string {
        return 'Password confirmation must match the password';
    }
}

/**
 * Users registration request data transfer object (DTO)
 *
 * This DTO is used for validating and transforming user registration data from client requests
 * before processing in the service layer. It implements comprehensive validation to ensure
 * data integrity and security, and is extensible for future needs (e.g., additional profile fields).
 *
 * Key features:
 * - Email normalization and validation
 * - Strong password requirements with confirmation
 * - Optional nickname with format validation
 * - Custom password matching validation
 * - Type-safe validation with class-validator
 */
export class RegisterDto {
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
     * Password confirmation field
     *
     * - Must be a string
     * - Required field
     * - Must match the password field exactly
     * - Uses custom validator for enhanced validation
     */
    @IsString({ message: 'Password confirmation must be a string' })
    @IsNotEmpty({ message: 'Password confirmation is required' })
    @Validate(IsPasswordMatchingConstraint)
    confirmPassword: string;

    /**
     * Optional user nickname/display name
     *
     * - Optional field (if not provided, email prefix will be used as default)
     * - If provided, must be a string between 3-50 characters
     * - Can only contain letters, numbers, underscores, and hyphens
     * - Automatically trimmed of whitespace
     */
    @IsOptional()
    @IsString({ message: 'Nickname must be a string' })
    @Length(3, 50, { message: 'Nickname must be between 3 and 50 characters long' })
    @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Nickname can only contain letters, numbers, underscores, and hyphens' })
    @Transform(({ value }) => value?.trim())
    nickname?: string;
}