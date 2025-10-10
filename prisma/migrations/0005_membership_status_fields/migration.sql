-- Add warnings and status tracking to memberships
ALTER TABLE "Membership"
  ADD COLUMN "warnings" INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN "isActive" BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN "kickedAt" TIMESTAMP(3);
