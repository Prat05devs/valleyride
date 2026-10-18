import type { PresignedUpload } from '@valleyride/shared';
import * as ImagePicker from 'expo-image-picker';
import { api, ApiError } from './api';

export type PickedFile = { uri: string; mimeType: 'image/jpeg' | 'image/png' };

/** Camera or library, compressed JPEG. Returns null if the rider cancels or denies permission. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<PickedFile | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new ApiError(0, 'PERMISSION', source === 'camera' ? 'Allow camera access in Settings to take the photo.' : 'Allow photo access in Settings to upload.');
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: false, exif: false };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;
  return { uri: res.assets[0].uri, mimeType: res.assets[0].mimeType === 'image/png' ? 'image/png' : 'image/jpeg' };
}

/** PUTs a local file to a pre-signed URL (S3, or the API's local stand-in in development). */
export async function putToSignedUrl(p: PresignedUpload, file: PickedFile) {
  const blob = await (await fetch(file.uri)).blob();
  const res = await fetch(p.uploadUrl, { method: 'PUT', headers: p.headers, body: blob });
  if (!res.ok) throw new ApiError(res.status, 'UPLOAD_FAILED', 'The upload did not finish. Please try again.');
}

export async function uploadKyc(type: 'DL' | 'AADHAAR' | 'PASSPORT', file: PickedFile) {
  const p = await api.post<PresignedUpload>('/kyc/documents/presign', { type, contentType: file.mimeType });
  await putToSignedUrl(p, file);
  return p.fileKey;
}
