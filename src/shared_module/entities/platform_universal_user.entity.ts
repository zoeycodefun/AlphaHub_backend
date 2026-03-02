import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn} from 'typeorm';
/**
 * platform users' main account table
 * store basic user information, support multiple exchanges, strategies, and sub accounts
 * design: platform account independent from exchanges accounts, support username or email login, and the password is encrypted
 * extendable
 */
@Entity({ name: 'platform_user'})
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class PlatformUserEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'auto increment primary key' })
    id: number;

    @Column({ type: 'varchar', length: 64, comment: 'unique username for login' })
    username: string;

    @Column({ type: 'varchar', length: 128, comment: 'encrypted password' })
    password: string;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'unique email for login and notification' })
    email: string | null;

    @Column({ type: 'varchar', length: 32, nullable: true, comment: 'phone number for login and notification' })
    phone: string | null;

    @Column({ type: 'varchar', length: 64, comment: 'user nickname for display' })
    nickname: string | null;

    @Column({ type: 'varchar', length: 256, nullable: true, comment: 'photo URL for user avatar' })
    avatar: string | null;

    @Column({ type: 'boolean', default: true, comment: 'account status, active or disabled' })
    enabled: boolean;

    @Column({ type: 'boolean', default: false, comment: 'whether the email is verified' })
    emailVerified: boolean;

    @Column({ type: 'boolean', default: false, comment: 'whether the phone is verified' })
    phoneVerified: boolean;

    @Column({ type: 'varchar', length: 32, comment: 'user role, e.g. user, admin' })
    role: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'additional info for future extension, e.g. user preferences' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'account creation time' })
    createdAt: Date;
    
    @UpdateDateColumn({ comment: 'account last update time' })
    updatedAt: Date;

    @Column({ type: 'bigint', nullable: true, comment: 'last login time(ms)' })
    lastLoginAt: number | null;
}
/**
 * use username as unique index, keep username unique for login
 * use email as unique index, keep email unique for login and notification
 * password is encrypted, ensure security
 * role field for permission control, simple role design for now, can be extended to more complex permission system in the future
 * extraInfo field for future extension, keep the design flexible and extendable
 */
