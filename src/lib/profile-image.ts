import {
  profileImageFileMetadataSchema,
  profileImageOptimizationSchema,
  type ProfileImageOptimization,
} from '@/contracts/profile';

const MAX_STORED_AVATAR_BYTES = 500_000;
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];
const DIMENSION_STEPS = [1, 0.85, 0.7];

export class ProfileImagePreparationError extends Error {}

export interface PreparedProfileImage {
  dataUrl: string;
  contentType: 'image/webp';
  width: number;
  height: number;
  size: number;
}

interface DecodedProfileImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decodeProfileImage(file: File): Promise<DecodedProfileImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Some browser engines cannot decode every valid File through createImageBitmap.
      // The image element fallback remains application-side resizing and compression.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(objectUrl),
      });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ProfileImagePreparationError('Não foi possível abrir a imagem selecionada.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new ProfileImagePreparationError('Não foi possível otimizar a imagem.')),
      'image/webp',
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new ProfileImagePreparationError('Não foi possível preparar a imagem.'));
    reader.onerror = () =>
      reject(new ProfileImagePreparationError('Não foi possível ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Prepares a profile avatar inside the browser. The person selects the original
 * file; resizing, EXIF orientation handling and compression are application work.
 */
export async function prepareProfileImage(
  file: File,
  options?: Partial<ProfileImageOptimization>,
): Promise<PreparedProfileImage> {
  try {
    profileImageFileMetadataSchema.parse({ name: file.name, type: file.type, size: file.size });
  } catch {
    throw new ProfileImagePreparationError('Use uma imagem PNG, JPEG ou WebP de até 10 MB.');
  }

  const settings = profileImageOptimizationSchema.parse(options ?? {});
  const image = await decodeProfileImage(file);

  try {
    const sourceLargestSide = Math.max(image.width, image.height);
    const baseScale = Math.min(1, settings.maxDimension / sourceLargestSide);

    for (const dimensionStep of DIMENSION_STEPS) {
      const width = Math.max(1, Math.round(image.width * baseScale * dimensionStep));
      const height = Math.max(1, Math.round(image.height * baseScale * dimensionStep));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context)
        throw new ProfileImagePreparationError('Seu navegador não suporta a otimização de imagem.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image.source, 0, 0, width, height);

      for (const quality of [
        settings.quality,
        ...QUALITY_STEPS.filter((step) => step < settings.quality),
      ]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= MAX_STORED_AVATAR_BYTES) {
          return {
            dataUrl: await blobToDataUrl(blob),
            contentType: 'image/webp',
            width,
            height,
            size: blob.size,
          };
        }
      }
    }
  } finally {
    image.release();
  }

  throw new ProfileImagePreparationError(
    'A imagem não pôde ser reduzida para um tamanho seguro. Tente outra foto.',
  );
}
