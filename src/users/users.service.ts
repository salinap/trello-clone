import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    const hashed = await bcrypt.hash(dto.password, 12);
    const verificationToken = randomUUID();
    const verificationExpiresHours = this.config.getOrThrow<number>(
      'app.emailVerificationExpiresHours',
    );
    const expires = new Date();
    expires.setHours(expires.getHours() + verificationExpiresHours);

    const user = this.usersRepo.create({
      ...dto,
      password: hashed,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expires,
    });

    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) throw new NotFoundException('Токен не найден');
    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new ConflictException('Токен истёк, запросите новый');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    return this.usersRepo.save(user);
  }
}
