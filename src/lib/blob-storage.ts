/**
 * Vercel Blob Storage Utility
 * 
 * Provides file upload, deletion, and listing functionality using Vercel Blob.
 * This is a free alternative to AWS S3 for serverless deployments.
 * 
 * Free tier: 1GB storage
 */

import { put, del, list } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Vercel Blob storage
 * 
 * @param fileBuffer - The file content as a Buffer
 * @param fileName - Original file name (used to extract extension)
 * @param folder - Optional folder path (e.g., 'profile-images', 'documents')
 * @returns The public URL of the uploaded file
 */
export async function uploadToBlob(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    // Extract file extension
    const ext = fileName.split('.').pop() || 'bin';
    
    // Generate unique filename
    const uniqueFileName = `${folder}/${uuidv4()}.${ext}`;
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, fileBuffer, {
      access: 'public',
      addRandomSuffix: false, // We already have UUID
    });
    
    return blob.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload a profile image to Vercel Blob storage
 * 
 * @param fileBuffer - The image content as a Buffer
 * @param fileType - MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns The public URL of the uploaded image
 */
export async function uploadProfileImage(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.split('/')[1] || 'jpg';
  const fileName = `temp.${ext}`; // Temporary name, will be replaced with UUID
  return uploadToBlob(fileBuffer, fileName, 'profile-images');
}

/**
 * Delete a file from Vercel Blob storage
 * 
 * @param url - The full URL of the file to delete
 * @returns True if deletion was successful
 */
export async function deleteFromBlob(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Blob deletion error:', error);
    return false;
  }
}

/**
 * List files in a specific folder
 * 
 * @param prefix - Folder prefix (e.g., 'profile-images/')
 * @param limit - Maximum number of files to return
 * @returns Array of blob objects with url, pathname, size, and uploadedAt
 */
export async function listBlobFiles(prefix?: string, limit: number = 100) {
  try {
    const { blobs } = await list({
      prefix,
      limit,
    });
    
    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
  } catch (error) {
    console.error('Blob list error:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if Blob storage is configured
 * 
 * @returns True if BLOB_READ_WRITE_TOKEN is set
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Get file size limit in bytes
 * Default: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed file types for uploads
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Validate file type
 * 
 * @param fileType - MIME type to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 */
export function isValidFileType(
  fileType: string,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES
): boolean {
  return allowedTypes.includes(fileType);
}

/**
 * Validate file size
 * 
 * @param fileSize - Size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is within limit
 */
export function isValidFileSize(
  fileSize: number,
  maxSize: number = MAX_FILE_SIZE
): boolean {
  return fileSize <= maxSize;
}
