export const ASPECT_RATIO = 4 / 3;

export const PHOTO_SIZES = {
  thumb:  { width: 120,  quality: 0.80 },
  grid:   { width: 400,  quality: 0.85 },
  detail: { width: 800,  quality: 0.90 },
  full:   { width: 1080, quality: 0.90 },
} as const;

export type PhotoSizeKey = keyof typeof PHOTO_SIZES;
