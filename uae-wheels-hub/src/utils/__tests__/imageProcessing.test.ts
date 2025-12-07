import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isHeicFile,
  convertHeicToJpeg,
  compressToJpeg,
  prepareImageForUpload
} from '../imageProcessing';

// Mock the external libraries
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file: File) => {
    // Simulate compression by returning a smaller file
    const blob = new Blob(['compressed'], { type: 'image/jpeg' });
    return Promise.resolve(new File([blob], file.name, { type: 'image/jpeg' }));
  })
}));

vi.mock('heic-to', () => ({
  heicTo: vi.fn(() => {
    const blob = new Blob(['converted'], { type: 'image/jpeg' });
    return Promise.resolve(blob);
  })
}));

describe('isHeicFile', () => {
  it('identifies HEIC files by MIME type', () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    expect(isHeicFile(heicFile)).toBe(true);
  });

  it('identifies HEIF files by MIME type', () => {
    const heifFile = new File(['content'], 'photo.heif', { type: 'image/heif' });
    expect(isHeicFile(heifFile)).toBe(true);
  });

  it('identifies HEIC files by extension when MIME type is missing', () => {
    const heicFile = new File(['content'], 'photo.heic', { type: '' });
    expect(isHeicFile(heicFile)).toBe(true);

    const heifFile = new File(['content'], 'photo.HEIF', { type: '' });
    expect(isHeicFile(heifFile)).toBe(true);
  });

  it('handles case-insensitive extensions', () => {
    const upperCase = new File(['content'], 'photo.HEIC', { type: '' });
    expect(isHeicFile(upperCase)).toBe(true);

    const mixedCase = new File(['content'], 'photo.HeIc', { type: '' });
    expect(isHeicFile(mixedCase)).toBe(true);
  });

  it('returns false for non-HEIC files', () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    expect(isHeicFile(jpegFile)).toBe(false);

    const pngFile = new File(['content'], 'photo.png', { type: 'image/png' });
    expect(isHeicFile(pngFile)).toBe(false);

    const webpFile = new File(['content'], 'photo.webp', { type: 'image/webp' });
    expect(isHeicFile(webpFile)).toBe(false);
  });
});

describe('convertHeicToJpeg', () => {
  it('converts HEIC to JPEG with default quality', async () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    const result = await convertHeicToJpeg(heicFile);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('converts HEIF to JPEG', async () => {
    const heifFile = new File(['content'], 'photo.heif', { type: 'image/heif' });
    const result = await convertHeicToJpeg(heifFile);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('respects custom quality parameter', async () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    const result = await convertHeicToJpeg(heicFile, 0.7);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('handles files with uppercase extensions', async () => {
    const heicFile = new File(['content'], 'photo.HEIC', { type: 'image/heic' });
    const result = await convertHeicToJpeg(heicFile);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('preserves base filename when converting', async () => {
    const heicFile = new File(['content'], 'my-vacation-photo.heic', { type: 'image/heic' });
    const result = await convertHeicToJpeg(heicFile);

    expect(result.name).toBe('my-vacation-photo.jpg');
  });
});

describe('compressToJpeg', () => {
  it('compresses image with default options', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressToJpeg(jpegFile);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toMatch(/\.jpe?g$/i);
  });

  it('accepts custom maxSizeMB option', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressToJpeg(jpegFile, { maxSizeMB: 1 });

    expect(result.type).toBe('image/jpeg');
  });

  it('accepts custom maxWidthOrHeight option', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressToJpeg(jpegFile, { maxWidthOrHeight: 1280 });

    expect(result.type).toBe('image/jpeg');
  });

  it('accepts custom quality option', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressToJpeg(jpegFile, { quality: 0.7 });

    expect(result.type).toBe('image/jpeg');
  });

  it('ensures .jpg extension for non-JPEG files', async () => {
    const pngFile = new File(['content'], 'photo.png', { type: 'image/png' });
    const result = await compressToJpeg(pngFile);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('accepts all compression options together', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressToJpeg(jpegFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1600,
      quality: 0.8
    });

    expect(result.type).toBe('image/jpeg');
  });
});

describe('prepareImageForUpload', () => {
  it('processes HEIC file and returns conversion info', async () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    const result = await prepareImageForUpload(heicFile);

    expect(result.file.type).toBe('image/jpeg');
    expect(result.wasHeic).toBe(true);
  });

  it('processes regular JPEG file without conversion', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await prepareImageForUpload(jpegFile);

    expect(result.file.type).toBe('image/jpeg');
    expect(result.wasHeic).toBe(false);
  });

  it('processes PNG file without HEIC conversion', async () => {
    const pngFile = new File(['content'], 'photo.png', { type: 'image/png' });
    const result = await prepareImageForUpload(pngFile);

    expect(result.file.type).toBe('image/jpeg');
    expect(result.wasHeic).toBe(false);
  });

  it('accepts custom HEIC quality option', async () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    const result = await prepareImageForUpload(heicFile, { heicQuality: 0.95 });

    expect(result.file.type).toBe('image/jpeg');
    expect(result.wasHeic).toBe(true);
  });

  it('accepts custom JPEG quality option', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await prepareImageForUpload(jpegFile, { jpegQuality: 0.8 });

    expect(result.file.type).toBe('image/jpeg');
  });

  it('accepts custom size and dimension options', async () => {
    const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await prepareImageForUpload(jpegFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280
    });

    expect(result.file.type).toBe('image/jpeg');
  });

  it('accepts all options together for HEIC file', async () => {
    const heicFile = new File(['content'], 'photo.heic', { type: 'image/heic' });
    const result = await prepareImageForUpload(heicFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1600,
      heicQuality: 0.95,
      jpegQuality: 0.85
    });

    expect(result.file.type).toBe('image/jpeg');
    expect(result.wasHeic).toBe(true);
  });

  it('returns proper file extension after processing', async () => {
    const heicFile = new File(['content'], 'my-photo.heic', { type: 'image/heic' });
    const result = await prepareImageForUpload(heicFile);

    expect(result.file.name).toBe('my-photo.jpg');
  });
});
