-- Clean up duplicate notifications before adding unique constraint
-- Keep only the most recent notification for each (userId, type, featureId) combination
DELETE FROM notifications
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "userId", type, "featureId" 
        ORDER BY "createdAt" DESC
      ) as rn
    FROM notifications
  ) t
  WHERE rn > 1
);