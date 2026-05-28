import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToUser1779972028682 implements MigrationInterface {
  name = 'AddAvatarUrlToUser1779972028682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatarUrl" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatarUrl"
        `);
  }
}
