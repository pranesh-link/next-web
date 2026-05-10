-- Allow a single creator (userId) to own multiple BodyProfile rows
-- (their own profile + their partner's profile in a couple).
-- Subject uniqueness is still enforced by body_profiles_subject_id_key.
DROP INDEX "body_profiles_userId_key";

-- Add a non-unique index for lookups by creator.
CREATE INDEX "body_profiles_userId_idx" ON "body_profiles"("userId");
