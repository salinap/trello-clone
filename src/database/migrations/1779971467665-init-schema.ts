import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1779971467665 implements MigrationInterface {
  name = 'InitSchema1779971467665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "citext"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')
        `);
    await queryRunner.query(`
        CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" citext NOT NULL,
            "password" character varying NOT NULL,
            "firstName" character varying,
            "lastName" character varying,
            "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER',
            "isEmailVerified" boolean NOT NULL DEFAULT false,
            "emailVerificationToken" character varying,
            "emailVerificationExpires" TIMESTAMP,
            "hashedRefreshToken" character varying,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
  }
}
