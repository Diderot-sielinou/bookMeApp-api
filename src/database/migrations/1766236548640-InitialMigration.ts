import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1766236548640 implements MigrationInterface {
  name = 'InitialMigration1766236548640';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."slots_status_enum" AS ENUM('AVAILABLE', 'RESERVED', 'BLOCKED')`
    );
    await queryRunner.query(
      `CREATE TABLE "slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prestataire_id" uuid NOT NULL, "service_id" uuid, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" "public"."slots_status_enum" NOT NULL DEFAULT 'AVAILABLE', "notes" text, "is_recurring" boolean NOT NULL DEFAULT false, "recurring_pattern_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "CHK_d3a2d17b53f8dc070affa19e84" CHECK ("end_time" > "start_time"), CONSTRAINT "PK_8b553bb1941663b63fd38405e42" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_d665438f7738c1becb11b6fd33" ON "slots" ("date") `);
    await queryRunner.query(`CREATE INDEX "IDX_d162070466b4028236f541f85b" ON "slots" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_52525293769a723332c7731c0a" ON "slots" ("prestataire_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prestataire_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "duration" integer NOT NULL, "price" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "image" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cadc77e857e870c94cd2f56316" ON "services" ("prestataire_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "client_id" uuid NOT NULL, "prestataire_id" uuid NOT NULL, "rating" integer NOT NULL, "quality_rating" integer, "punctuality_rating" integer, "cleanliness_rating" integer, "comment" text, "prestataire_response" text, "response_at" TIMESTAMP, "flagged" boolean NOT NULL DEFAULT false, "flag_reason" text, "flagged_by" uuid, "edit_count" integer NOT NULL DEFAULT '0', "edited_at" TIMESTAMP, "original_comment" text, "is_visible" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b0355254b748096d3e4d9a9ac2b" UNIQUE ("appointment_id"), CONSTRAINT "REL_b0355254b748096d3e4d9a9ac2" UNIQUE ("appointment_id"), CONSTRAINT "CHK_47025c27818a5b67806d75dad4" CHECK ("cleanliness_rating" IS NULL OR ("cleanliness_rating" >= 1 AND "cleanliness_rating" <= 5)), CONSTRAINT "CHK_788328eef57dcbe0076e2dd7a9" CHECK ("punctuality_rating" IS NULL OR ("punctuality_rating" >= 1 AND "punctuality_rating" <= 5)), CONSTRAINT "CHK_d62cf0f8be77e2b8eff89c7fe3" CHECK ("quality_rating" IS NULL OR ("quality_rating" >= 1 AND "quality_rating" <= 5)), CONSTRAINT "CHK_e87bbcfbe3ea0dda3d626010ee" CHECK ("rating" >= 1 AND "rating" <= 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b0355254b748096d3e4d9a9ac2" ON "reviews" ("appointment_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d4e7e923e6bb78a8f0add75449" ON "reviews" ("client_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7fbe057840b4b36d5ec747b472" ON "reviews" ("prestataire_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3b0d4755fa5510f2a4041ffc8" ON "reviews" ("created_at") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."badges_type_enum" AS ENUM('TOP_RATED', 'RESPONSIVE', 'RELIABLE', 'POPULAR')`
    );
    await queryRunner.query(
      `CREATE TABLE "badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prestataire_id" uuid NOT NULL, "type" "public"."badges_type_enum" NOT NULL, "awarded_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_ae410e0d03e6be31ea722c41a99" UNIQUE ("prestataire_id", "type"), CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e624e25be9a5acd1c22357a783" ON "badges" ("prestataire_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prestataires_status_enum" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED')`
    );
    await queryRunner.query(
      `CREATE TABLE "prestataires" ("id" uuid NOT NULL, "business_name" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "bio" text, "categories" character varying array NOT NULL DEFAULT '{}', "phone" character varying(20) NOT NULL, "avatar" text, "portfolio_images" text array, "opening_hours" jsonb, "pause_duration" integer NOT NULL DEFAULT '0', "min_booking_notice" integer NOT NULL DEFAULT '2', "min_cancellation_hours" integer NOT NULL DEFAULT '24', "cancellation_policy" text, "status" "public"."prestataires_status_enum" NOT NULL DEFAULT 'PENDING', "average_rating" numeric(3,2) NOT NULL DEFAULT '0', "total_reviews" integer NOT NULL DEFAULT '0', "total_appointments" integer NOT NULL DEFAULT '0', "address" text, "city" character varying(100), "postal_code" character varying(10), "profile_completed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0bd9977e04dca68de22d1c6f8a2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edaf0381b8720c8a90f9cd0972" ON "prestataires" ("business_name") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a08115abfe8286ab6eb2c24d8" ON "prestataires" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prestataires_rating" ON "prestataires" ("average_rating") `
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "flagged" boolean NOT NULL DEFAULT false, "flag_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d0d0a2b147a6031bafa7d1c21c" ON "messages" ("appointment_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22133395bd13b970ccd0c34ab2" ON "messages" ("sender_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73a49bfc9d7c8dc397e535b010" ON "messages" ("read") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('CONFIRMED', 'CANCELLED', 'COMPLETED')`
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" uuid NOT NULL, "prestataire_id" uuid NOT NULL, "slot_id" uuid NOT NULL, "service_id" uuid NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'CONFIRMED', "client_note" text, "cancelled_by" uuid, "cancelled_at" TIMESTAMP, "cancellation_reason" text, "completed_at" TIMESTAMP, "price_at_booking" numeric(10,2) NOT NULL, "reminder_24h_sent" boolean NOT NULL DEFAULT false, "reminder_1h_sent" boolean NOT NULL DEFAULT false, "review_request_sent" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_b1ccdd43ac8ccbb787c68a64a1" UNIQUE ("slot_id"), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc5bbce58ad6bc96faa428b1e" ON "appointments" ("client_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23d64eeb3170011c6a9c85ced5" ON "appointments" ("prestataire_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b1ccdd43ac8ccbb787c68a64a1" ON "appointments" ("slot_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3007a47d97a542e63b3308a69b" ON "appointments" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_387464fb81909344c275230cc0" ON "appointments" ("created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "phone" character varying(20), "avatar" text, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('CLIENT', 'PRESTATAIRE', 'ADMIN')`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying(255), "email_verification_expires" TIMESTAMP, "password_reset_token" character varying(255), "password_reset_expires" TIMESTAMP, "two_factor_enabled" boolean NOT NULL DEFAULT false, "two_factor_secret" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "related_id" uuid, "data" jsonb, "read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "email_sent" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b7ed75170d2d7dca4477cc94" ON "notifications" ("read") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "user_agent" text, "ip_address" character varying(45), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" character varying(100) NOT NULL, "entity_type" character varying(50), "entity_id" uuid, "details" jsonb, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ADD CONSTRAINT "FK_6d8a5a3690befb1ef124e8b400f" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ADD CONSTRAINT "FK_2cf2d9cd90bc6e98eeea907eee6" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_cadc77e857e870c94cd2f56316c" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_b0355254b748096d3e4d9a9ac2b" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_d4e7e923e6bb78a8f0add754493" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_7fbe057840b4b36d5ec747b4729" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "badges" ADD CONSTRAINT "FK_e624e25be9a5acd1c22357a7837" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "prestataires" ADD CONSTRAINT "FK_0bd9977e04dca68de22d1c6f8a2" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_d0d0a2b147a6031bafa7d1c21c9" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_ccc5bbce58ad6bc96faa428b1e4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_23d64eeb3170011c6a9c85ced58" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_b1ccdd43ac8ccbb787c68a64a13" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_671b4499922315bccf6c4fa8c65" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_f1ab7cf3a5714dbc6bb4e1c28a4" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_f1ab7cf3a5714dbc6bb4e1c28a4"`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_671b4499922315bccf6c4fa8c65"`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857"`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_b1ccdd43ac8ccbb787c68a64a13"`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_23d64eeb3170011c6a9c85ced58"`
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_ccc5bbce58ad6bc96faa428b1e4"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_d0d0a2b147a6031bafa7d1c21c9"`
    );
    await queryRunner.query(
      `ALTER TABLE "prestataires" DROP CONSTRAINT "FK_0bd9977e04dca68de22d1c6f8a2"`
    );
    await queryRunner.query(
      `ALTER TABLE "badges" DROP CONSTRAINT "FK_e624e25be9a5acd1c22357a7837"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_7fbe057840b4b36d5ec747b4729"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_d4e7e923e6bb78a8f0add754493"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_b0355254b748096d3e4d9a9ac2b"`
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_cadc77e857e870c94cd2f56316c"`
    );
    await queryRunner.query(`ALTER TABLE "slots" DROP CONSTRAINT "FK_2cf2d9cd90bc6e98eeea907eee6"`);
    await queryRunner.query(`ALTER TABLE "slots" DROP CONSTRAINT "FK_6d8a5a3690befb1ef124e8b400f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8b7ed75170d2d7dca4477cc94"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_387464fb81909344c275230cc0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3007a47d97a542e63b3308a69b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b1ccdd43ac8ccbb787c68a64a1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23d64eeb3170011c6a9c85ced5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ccc5bbce58ad6bc96faa428b1e"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73a49bfc9d7c8dc397e535b010"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_22133395bd13b970ccd0c34ab2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d0d0a2b147a6031bafa7d1c21c"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP INDEX "public"."idx_prestataires_rating"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a08115abfe8286ab6eb2c24d8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_edaf0381b8720c8a90f9cd0972"`);
    await queryRunner.query(`DROP TABLE "prestataires"`);
    await queryRunner.query(`DROP TYPE "public"."prestataires_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e624e25be9a5acd1c22357a783"`);
    await queryRunner.query(`DROP TABLE "badges"`);
    await queryRunner.query(`DROP TYPE "public"."badges_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d3b0d4755fa5510f2a4041ffc8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7fbe057840b4b36d5ec747b472"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d4e7e923e6bb78a8f0add75449"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b0355254b748096d3e4d9a9ac2"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cadc77e857e870c94cd2f56316"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_52525293769a723332c7731c0a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d162070466b4028236f541f85b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d665438f7738c1becb11b6fd33"`);
    await queryRunner.query(`DROP TABLE "slots"`);
    await queryRunner.query(`DROP TYPE "public"."slots_status_enum"`);
  }
}
