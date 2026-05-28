import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'src/users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

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

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async verifyEmail(token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email успешно подтверждён. Теперь вы можете войти.' };
  }
}
