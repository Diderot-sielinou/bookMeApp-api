import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1702800000000 implements MigrationInterface {
  name = 'InitialSchema1702800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('CLIENT', 'PRESTATAIRE', 'ADMIN');
      CREATE TYPE "prestataire_status_enum" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
      CREATE TYPE "slot_status_enum" AS ENUM ('AVAILABLE', 'RESERVED', 'BLOCKED');
      CREATE TYPE "appointment_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
      CREATE TYPE "badge_type_enum" AS ENUM ('TOP_RATED', 'RESPONSIVE', 'RELIABLE', 'POPULAR');
      CREATE TYPE "notification_type_enum" AS ENUM ('NEW_BOOKING', 'CANCELLATION', 'REMINDER', 'NEW_REVIEW', 'NEW_MESSAGE', 'BADGE_EARNED', 'SYSTEM');
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'CLIENT',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying(255),
        "email_verification_expires" TIMESTAMP,
        "password_reset_token" character varying(255),
        "password_reset_expires" TIMESTAMP,
        "two_factor_secret" character varying(255),
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create clients table
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "phone" character varying(20),
        "avatar" character varying(500),
        "notification_preferences" jsonb DEFAULT '{"email":true,"push":true,"sms":false}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clients_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create prestataires table
    await queryRunner.query(`
      CREATE TABLE "prestataires" (
        "id" uuid NOT NULL,
        "business_name" character varying(200) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "bio" text,
        "categories" text[] NOT NULL DEFAULT '{}',
        "phone" character varying(20) NOT NULL,
        "avatar" character varying(500),
        "portfolio_images" text[] DEFAULT '{}',
        "opening_hours" jsonb,
        "pause_duration" integer NOT NULL DEFAULT 0,
        "min_booking_notice" integer NOT NULL DEFAULT 24,
        "min_cancellation_hours" integer NOT NULL DEFAULT 24,
        "cancellation_policy" text,
        "status" "prestataire_status_enum" NOT NULL DEFAULT 'PENDING',
        "average_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "total_reviews" integer NOT NULL DEFAULT 0,
        "total_appointments" integer NOT NULL DEFAULT 0,
        "address" character varying(500),
        "city" character varying(100),
        "postal_code" character varying(10),
        "profile_completed" boolean NOT NULL DEFAULT false,
        "notification_preferences" jsonb DEFAULT '{"email":true,"push":true,"sms":false}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prestataires" PRIMARY KEY ("id"),
        CONSTRAINT "FK_prestataires_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create services table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prestataire_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "description" text,
        "duration" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "image" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_prestataire" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE
      )
    `);

    // Create slots table
    await queryRunner.query(`
      CREATE TABLE "slots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prestataire_id" uuid NOT NULL,
        "service_id" uuid,
        "date" date NOT NULL,
        "start_time" character varying(5) NOT NULL,
        "end_time" character varying(5) NOT NULL,
        "status" "slot_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "notes" text,
        "is_recurring" boolean NOT NULL DEFAULT false,
        "recurring_pattern_id" character varying(100),
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_slot_times" CHECK (end_time > start_time),
        CONSTRAINT "PK_slots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_slots_prestataire" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_slots_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL
      )
    `);

    // Create appointments table
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "prestataire_id" uuid NOT NULL,
        "slot_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "status" "appointment_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "client_note" text,
        "cancelled_by" uuid,
        "cancelled_at" TIMESTAMP,
        "cancellation_reason" text,
        "completed_at" TIMESTAMP,
        "price_at_booking" decimal(10,2) NOT NULL,
        "reminder_24h_sent" boolean NOT NULL DEFAULT false,
        "reminder_1h_sent" boolean NOT NULL DEFAULT false,
        "review_request_sent" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointments_prestataire" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointments_slot" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT
      )
    `);

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appointment_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "prestataire_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "quality_rating" integer,
        "punctuality_rating" integer,
        "cleanliness_rating" integer,
        "comment" text,
        "prestataire_response" text,
        "response_at" TIMESTAMP,
        "flagged" boolean NOT NULL DEFAULT false,
        "flag_reason" character varying(500),
        "flagged_by" uuid,
        "edit_count" integer NOT NULL DEFAULT 0,
        "edited_at" TIMESTAMP,
        "original_comment" text,
        "is_visible" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_rating" CHECK (rating >= 1 AND rating <= 5),
        CONSTRAINT "CHK_quality_rating" CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
        CONSTRAINT "CHK_punctuality_rating" CHECK (punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)),
        CONSTRAINT "CHK_cleanliness_rating" CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5)),
        CONSTRAINT "UQ_reviews_appointment" UNIQUE ("appointment_id"),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_prestataire" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appointment_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "flagged" boolean NOT NULL DEFAULT false,
        "flag_reason" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "related_id" uuid,
        "data" jsonb,
        "read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "email_sent" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create badges table
    await queryRunner.query(`
      CREATE TABLE "badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prestataire_id" uuid NOT NULL,
        "type" "badge_type_enum" NOT NULL,
        "awarded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_badges_prestataire_type" UNIQUE ("prestataire_id", "type"),
        CONSTRAINT "PK_badges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_badges_prestataire" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE CASCADE
      )
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" character varying(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "user_agent" character varying(500),
        "ip_address" character varying(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "action" character varying(100) NOT NULL,
        "entity_type" character varying(100) NOT NULL,
        "entity_id" uuid,
        "details" jsonb,
        "ip_address" inet,
        "user_agent" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`
      -- Users indexes
      CREATE INDEX "idx_users_email" ON "users" ("email");
      CREATE INDEX "idx_users_role" ON "users" ("role");
      
      -- Prestataires indexes
      CREATE INDEX "idx_prestataires_status" ON "prestataires" ("status");
      CREATE INDEX "idx_prestataires_city" ON "prestataires" ("city");
      CREATE INDEX "idx_prestataires_rating" ON "prestataires" ("average_rating" DESC);
      CREATE INDEX "idx_prestataires_categories" ON "prestataires" USING GIN ("categories");
      
      -- Services indexes
      CREATE INDEX "idx_services_prestataire" ON "services" ("prestataire_id");
      CREATE INDEX "idx_services_active" ON "services" ("prestataire_id", "is_active");
      
      -- Slots indexes
      CREATE INDEX "idx_slots_prestataire_date" ON "slots" ("prestataire_id", "date");
      CREATE INDEX "idx_slots_status" ON "slots" ("status");
      CREATE INDEX "idx_slots_available" ON "slots" ("prestataire_id", "status", "date") WHERE deleted_at IS NULL;
      
      -- Appointments indexes
      CREATE INDEX "idx_appointments_client" ON "appointments" ("client_id");
      CREATE INDEX "idx_appointments_prestataire" ON "appointments" ("prestataire_id");
      CREATE INDEX "idx_appointments_status" ON "appointments" ("status");
      CREATE INDEX "idx_appointments_slot" ON "appointments" ("slot_id");
      
      -- Reviews indexes
      CREATE INDEX "idx_reviews_prestataire" ON "reviews" ("prestataire_id");
      CREATE INDEX "idx_reviews_client" ON "reviews" ("client_id");
      CREATE INDEX "idx_reviews_rating" ON "reviews" ("prestataire_id", "rating");
      CREATE INDEX "idx_reviews_flagged" ON "reviews" ("flagged") WHERE flagged = true;
      
      -- Messages indexes
      CREATE INDEX "idx_messages_appointment" ON "messages" ("appointment_id");
      CREATE INDEX "idx_messages_sender" ON "messages" ("sender_id");
      CREATE INDEX "idx_messages_unread" ON "messages" ("appointment_id", "read") WHERE read = false;
      
      -- Notifications indexes
      CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id");
      CREATE INDEX "idx_notifications_unread" ON "notifications" ("user_id", "read") WHERE read = false;
      
      -- Badges indexes
      CREATE INDEX "idx_badges_prestataire" ON "badges" ("prestataire_id");
      CREATE INDEX "idx_badges_active" ON "badges" ("prestataire_id", "is_active") WHERE is_active = true;
      
      -- Refresh tokens indexes
      CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token");
      
      -- Audit logs indexes
      CREATE INDEX "idx_audit_logs_user" ON "audit_logs" ("user_id");
      CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action");
      CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");
      CREATE INDEX "idx_audit_logs_created" ON "audit_logs" ("created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "slots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prestataires" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE IF EXISTS "notification_type_enum";
      DROP TYPE IF EXISTS "badge_type_enum";
      DROP TYPE IF EXISTS "appointment_status_enum";
      DROP TYPE IF EXISTS "slot_status_enum";
      DROP TYPE IF EXISTS "prestataire_status_enum";
      DROP TYPE IF EXISTS "user_role_enum";
    `);
  }
}
