import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsPhoneNumber,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';

// ==========================================
// REGISTER CLIENT DTO
// ==========================================
export class RegisterClientDto {
  @ApiProperty({
    description: 'Email address',
    example: 'client@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password (min 8 chars, 1 uppercase, 1 number, 1 special char)',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  password: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+33612345678',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;
}

// ==========================================
// REGISTER PRESTATAIRE DTO
// ==========================================
export class RegisterPrestataireDto {
  @ApiProperty({
    description: 'Email address',
    example: 'prestataire@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  password: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Salon de Beauté Marie',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName: string;

  @ApiProperty({
    description: 'First name',
    example: 'Marie',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Dupont',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+33612345678',
  })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({
    description: 'Professional categories',
    example: ['Coiffure', 'Esthétique'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsString({ each: true })
  categories: string[];
}

// ==========================================
// LOGIN DTO
// ==========================================
export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

// ==========================================
// VERIFY EMAIL DTO
// ==========================================
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// ==========================================
// FORGOT PASSWORD DTO
// ==========================================
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

// ==========================================
// RESET PASSWORD DTO
// ==========================================
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  newPassword: string;
}

// ==========================================
// REFRESH TOKEN DTO
// ==========================================
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// ==========================================
// CHANGE PASSWORD DTO
// ==========================================
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldSecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  newPassword: string;
}

// ==========================================
// ENABLE 2FA DTO
// ==========================================
export class Enable2FADto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

// ==========================================
// VERIFY 2FA DTO
// ==========================================
export class Verify2FADto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

// ==========================================
// AUTH RESPONSE INTERFACES
// ==========================================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  tokens: AuthTokens;
}
