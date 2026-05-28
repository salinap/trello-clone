import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../users/dto/login.dto';

type JwtExpiresIn = import('@nestjs/jwt').JwtSignOptions['expiresIn'];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.config.getOrThrow<JwtExpiresIn>('jwt.accessExpiresIn'),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<JwtExpiresIn>('jwt.refreshExpiresIn'),
      },
    );

    await this.usersService.setCurrentRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);

    // отправляем письмо
    if (user.emailVerificationToken) {
      await this.mailService.sendVerificationEmail(
        user.email,
        user.emailVerificationToken,
      );
    }

    return {
      message: 'Регистрация успешна. Проверьте email для подтверждения.',
      userId: user.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Неверный email или пароль');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Неверный email или пароль');

    if (!user.isEmailVerified) {
      throw new BadRequestException('Сначала подтвердите email');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        },
      );
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token отозван');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Сначала подтвердите email');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.usersService.clearRefreshToken(userId);
    return { message: 'Выход выполнен. Сессия отозвана.' };
  }

  async revoke(currentUserId: string, refreshToken: string) {
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        },
      );
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }

    if (payload.sub !== currentUserId) {
      throw new UnauthorizedException('Нельзя отзывать чужую сессию');
    }

    await this.usersService.clearRefreshToken(payload.sub);
    return { message: 'Refresh token отозван.' };
  }

  async verifyEmail(token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email успешно подтверждён. Теперь вы можете войти.' };
  }
}
