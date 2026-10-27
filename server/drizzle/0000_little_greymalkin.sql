CREATE TABLE "machines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"build_x_mm" integer NOT NULL,
	"build_y_mm" integer NOT NULL,
	"build_z_mm" integer NOT NULL,
	"is_enclosed" boolean DEFAULT false NOT NULL,
	"hourly_rate_lkr" numeric(10, 2) NOT NULL,
	"is_online" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"density_g_cm3" numeric(6, 3) NOT NULL,
	"cost_per_gram_lkr" numeric(10, 2) NOT NULL,
	"tag" varchar(50) NOT NULL,
	"requires_enclosure" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"material" varchar(100),
	"image_url" text NOT NULL,
	"aspect_ratio" varchar(20) DEFAULT 'auto',
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"price_lkr" numeric(10, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"bounding_x" numeric(8, 2) NOT NULL,
	"bounding_y" numeric(8, 2) NOT NULL,
	"bounding_z" numeric(8, 2) NOT NULL,
	"volume_cm3" numeric(10, 3) NOT NULL,
	"surface_area_cm2" numeric(10, 3) NOT NULL,
	"material_id" uuid NOT NULL,
	"machine_id" uuid,
	"infill_percentage" integer NOT NULL,
	"layer_height_mm" numeric(4, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"estimated_grams" numeric(8, 2) NOT NULL,
	"estimated_print_hours" numeric(8, 2) NOT NULL,
	"material_cost_lkr" numeric(10, 2) NOT NULL,
	"machine_cost_lkr" numeric(10, 2) NOT NULL,
	"handling_cost_lkr" numeric(10, 2) NOT NULL,
	"total_price_lkr" numeric(10, 2) NOT NULL,
	"customer_phone" varchar(30),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;