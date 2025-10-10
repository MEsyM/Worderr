-- Add turn timing and warning columns to rooms
ALTER TABLE "Room"
  ADD COLUMN "maxTurnSeconds" INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN "maxWarnings" INTEGER DEFAULT 3 NOT NULL,
  ADD COLUMN "currentTurnMembershipId" TEXT,
  ADD COLUMN "currentTurnStartedAt" TIMESTAMP(3);

-- Ensure the current turn membership reference is unique
CREATE UNIQUE INDEX "Room_currentTurnMembershipId_key" ON "Room"("currentTurnMembershipId");

-- Link the current turn membership to memberships
ALTER TABLE "Room"
  ADD CONSTRAINT "Room_currentTurnMembershipId_fkey"
  FOREIGN KEY ("currentTurnMembershipId") REFERENCES "Membership"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
