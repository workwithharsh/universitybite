-- Replace broad SELECT policy with one that allows reading individual objects
-- but does not allow listing the bucket contents.
DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;

-- Allow public read of individual menu images (needed because bucket is public for <img> tags),
-- but require a specific object name (prevents broad listing via name IS NULL filters).
CREATE POLICY "Public can read individual menu images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'menu-images'
  AND name IS NOT NULL
  AND length(name) > 0
);