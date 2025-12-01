import imageCompression from 'browser-image-compression';
import { heicTo } from 'heic-to';

const HEIC_REGEX = /\.(heic|heif)$/i;

export function isHeicFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || HEIC_REGEX.test(fileName);
}

function ensureJpegExtension(file: File, originalName: string) {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'photo';
  const normalizedName = /\.jpe?g$/i.test(file.name) ? file.name : `${baseName}.jpg`;

  if (file.type !== 'image/jpeg' || file.name !== normalizedName) {
    return new File([file], normalizedName, { type: 'image/jpeg' });
  }

  return file;
}

export async function convertHeicToJpeg(file: File, quality = 0.9) {
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality,
  });

  const jpegFile = new File([jpegBlob], file.name.replace(HEIC_REGEX, '.jpg'), { type: 'image/jpeg' });
  return ensureJpegExtension(jpegFile, file.name);
}

export async function compressToJpeg(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  }
) {
  const compressed = await imageCompression(file, {
    maxSizeMB: options?.maxSizeMB ?? 2,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: options?.quality ?? 0.85,
  });

  return ensureJpegExtension(compressed as File, file.name);
}

export async function prepareImageForUpload(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    heicQuality?: number;
    jpegQuality?: number;
  }
) {
  const wasHeic = isHeicFile(file);
  let workingFile = file;

  if (wasHeic) {
    workingFile = await convertHeicToJpeg(file, options?.heicQuality ?? 0.92);
  }

  const compressedFile = await compressToJpeg(workingFile, {
    maxSizeMB: options?.maxSizeMB,
    maxWidthOrHeight: options?.maxWidthOrHeight,
    quality: options?.jpegQuality,
  });

  return {
    file: compressedFile,
    wasHeic,
  };
}
