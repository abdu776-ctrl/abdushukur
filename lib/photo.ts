'use client';

// Resume photos are stored inside the document as a data URL, so the file the
// user picks goes straight into the database row and into the local draft.
//
// A phone camera photo is 3–6 MB, which becomes ~8 MB once base64-encoded —
// too big to save reliably and far more than a 3×4 cm photo box needs. Every
// picture is therefore downscaled before it is ever stored.

/** Longest edge of the stored image, in pixels. A 3×4 cm print box needs far
 *  less; this leaves room for a high-DPI preview. */
const MAX_EDGE = 900;
const JPEG_QUALITY = 0.85;

/** Reject obviously oversized files before decoding them. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export class PhotoTooLargeError extends Error {
  constructor() {
    super('photo-too-large');
    this.name = 'PhotoTooLargeError';
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

/**
 * Read a picked file into a data URL that is safe to store: downscaled to at
 * most MAX_EDGE on the long side and re-encoded as JPEG.
 *
 * Throws PhotoTooLargeError for files over the stated limit. If the browser
 * cannot decode or re-encode the image, the original data URL is returned
 * rather than failing outright.
 */
export async function readResumePhoto(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new PhotoTooLargeError();

  const original = await readAsDataUrl(file);

  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    if (scale === 1 && original.length < 400_000) return original;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    // A white base, so a transparent PNG does not turn black as JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch (err) {
    console.error('photo downscale failed, keeping the original:', err);
    return original;
  }
}
