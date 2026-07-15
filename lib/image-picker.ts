// Thin wrapper over expo-image-picker (SDK 54 API) for picking images and
// shaping them for multipart upload.

import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  name: string;
  type: string; // MIME type, e.g. image/jpeg
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function toPicked(asset: ImagePicker.ImagePickerAsset): PickedImage {
  const type = asset.mimeType || 'image/jpeg';
  // Keep the filename extension consistent with the actual MIME type. After an
  // edit, iOS re-encodes to JPEG but may keep the original `.heic` fileName —
  // a mismatched extension can confuse multipart parsers, so derive it from
  // the MIME type instead.
  const ext = EXT_BY_MIME[type] ?? 'jpg';
  const base = asset.fileName?.replace(/\.[^.]+$/, '') || `image-${asset.assetId ?? 'upload'}`;
  return { uri: asset.uri, name: `${base}.${ext}`, type };
}

export interface PickOptions {
  /**
   * Present the single-image crop/edit UI. Besides letting the user frame the
   * shot, this makes iOS re-encode the result as JPEG — which sidesteps HEIC
   * originals that the upload backend rejects. Ignored when picking multiple.
   * Use for avatars and other single, croppable images.
   */
  edit?: boolean;
  /** Crop aspect ratio for `edit` mode, e.g. [1, 1] for a square avatar. */
  aspect?: [number, number];
}

/**
 * Pick up to `limit` images from the library. Returns [] when the user
 * cancels or denies permission (callers surface their own messaging).
 */
export async function pickImages(limit = 1, options: PickOptions = {}): Promise<PickedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  // `allowsEditing` only applies to single-image picks.
  const allowsEditing = limit === 1 && Boolean(options.edit);

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
    allowsEditing,
    aspect: options.aspect,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.slice(0, limit).map(toPicked);
}
