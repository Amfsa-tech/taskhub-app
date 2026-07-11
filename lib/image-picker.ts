// Thin wrapper over expo-image-picker (SDK 54 API) for picking images and
// shaping them for multipart upload.

import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  name: string;
  type: string; // MIME type, e.g. image/jpeg
}

function toPicked(asset: ImagePicker.ImagePickerAsset): PickedImage {
  const name = asset.fileName || asset.uri.split('/').pop() || `image-${asset.assetId ?? 'upload'}.jpg`;
  const type = asset.mimeType || 'image/jpeg';
  return { uri: asset.uri, name, type };
}

/**
 * Pick up to `limit` images from the library. Returns [] when the user
 * cancels or denies permission (callers surface their own messaging).
 */
export async function pickImages(limit = 1): Promise<PickedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.slice(0, limit).map(toPicked);
}
