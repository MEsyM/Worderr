-- Add room configuration fields
ALTER TABLE "Room"
  ADD COLUMN "prompts" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "maxWords" INTEGER DEFAULT 40 NOT NULL,
  ADD COLUMN "maxSentences" INTEGER DEFAULT 2 NOT NULL,
  ADD COLUMN "forbiddenWords" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN "rhymeTarget" TEXT;
