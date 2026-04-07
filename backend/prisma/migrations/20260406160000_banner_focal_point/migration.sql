-- Add focal point for banner background-position control
ALTER TABLE "Banner"
ADD COLUMN "focalX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "focalY" DOUBLE PRECISION NOT NULL DEFAULT 50;

