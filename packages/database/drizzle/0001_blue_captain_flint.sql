CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"upload_session_id" uuid,
	"original_filename" varchar(255) NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"object_key" text NOT NULL,
	"sha256" char(64) NOT NULL,
	"bytes" bigint NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"duration_ms" integer,
	"width" integer,
	"height" integer,
	"rotation" smallint,
	"frame_rate" varchar(20),
	"captured_at" timestamp with time zone,
	"state" varchar(40) DEFAULT 'validating' NOT NULL,
	"safe_error_code" varchar(80),
	"analysis_version" varchar(40),
	"delete_after" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_parts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"upload_session_id" uuid NOT NULL,
	"part_number" integer NOT NULL,
	"etag" varchar(255),
	"bytes" integer,
	"checksum" varchar(128),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by" uuid,
	"object_key" text NOT NULL,
	"filename" varchar(255) NOT NULL,
	"declared_mime" varchar(120) NOT NULL,
	"declared_bytes" bigint NOT NULL,
	"expected_sha256" char(64) NOT NULL,
	"multipart_upload_id" text NOT NULL,
	"part_size" integer NOT NULL,
	"part_count" integer NOT NULL,
	"state" varchar(20) DEFAULT 'uploading' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"aborted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_upload_session_id_upload_sessions_id_fk" FOREIGN KEY ("upload_session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_parts" ADD CONSTRAINT "upload_parts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_parts" ADD CONSTRAINT "upload_parts_upload_session_id_upload_sessions_id_fk" FOREIGN KEY ("upload_session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assets_object_key_uidx" ON "assets" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_upload_session_uidx" ON "assets" USING btree ("upload_session_id");--> statement-breakpoint
CREATE INDEX "assets_workspace_state_idx" ON "assets" USING btree ("workspace_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "upload_parts_session_part_uidx" ON "upload_parts" USING btree ("upload_session_id","part_number");--> statement-breakpoint
CREATE INDEX "upload_parts_workspace_idx" ON "upload_parts" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "upload_sessions_object_key_uidx" ON "upload_sessions" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "upload_sessions_workspace_state_idx" ON "upload_sessions" USING btree ("workspace_id","state");--> statement-breakpoint
CREATE INDEX "upload_sessions_expires_idx" ON "upload_sessions" USING btree ("expires_at");