/**
 * Appends Cloudinary transformation parameters to a Cloudinary URL.
 * Handles both upload URLs (with /upload/) and non-Cloudinary URLs (returned as-is).
 *
 * @param url   The original Cloudinary image URL
 * @param width  Target width in pixels
 * @param height Target height in pixels (optional; omit for aspect-ratio-preserving resize)
 * @returns      The transformed URL with quality and format auto-optimisation applied
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number,
  height?: number,
): string {
  if (!url) return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const transforms = [`w_${width}`, 'f_auto', 'q_auto'];
  if (height) transforms.push(`h_${height}`, 'c_fill');

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}
