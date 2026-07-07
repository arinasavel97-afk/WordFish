-- Add optional set accent color for Vocabulary Builder header and Dashboard card strips.
-- Safe to run multiple times.

ALTER TABLE public.sets
ADD COLUMN IF NOT EXISTS accent_color text;

UPDATE public.sets
SET accent_color = 'orange'
WHERE accent_color IS NULL OR btrim(accent_color) = '';

ALTER TABLE public.sets
ALTER COLUMN accent_color SET DEFAULT 'orange';

COMMENT ON COLUMN public.sets.accent_color IS
    'Set accent slug (orange, yellow, green, teal, blue, purple, pink, red) for header gradient and dashboard strip.';
