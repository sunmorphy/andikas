import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import {getMediaUrl} from '../utils/media.js';

dotenv.config();

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export interface R2UploadResult {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    height: number;
    width: number;
    size: number;
    filePath: string;
    tags?: string[] | null;
    isPrivateFile?: boolean | null;
    customCoordinates?: string | null;
}

export const uploadToR2 = async (file: Buffer, fileName: string, username?: string, subFolder?: string): Promise<R2UploadResult> => {
    try {
        const sanitizedFileName = sanitizeFileName(fileName);
        const bucketName = process.env.R2_BUCKET_NAME!;

        const contentType = getContentType(fileName);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: sanitizedFileName,
            Body: file,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await r2Client.send(command);

        const url = getMediaUrl(sanitizedFileName) || sanitizedFileName;

        return {
            fileId: generateFileId(sanitizedFileName),
            name: sanitizedFileName,
            url: url,
            thumbnailUrl: url,
            height: 0,
            width: 0,
            size: file.length,
            filePath: sanitizedFileName,
            tags: null,
            isPrivateFile: false,
            customCoordinates: null,
        };
    } catch (error) {
        throw new Error(`R2 upload failed: ${error}`);
    }
};

export const uploadProfileImageToR2 = async (file: Buffer, fileName: string, username?: string): Promise<R2UploadResult> => {
    return uploadToR2(file, fileName, username, 'users');
};

function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/\s+/g, '-')
        .replace(/[^\w\-\.]/g, '')
        .replace(/\-+/g, '-')
        .toLowerCase();
}

function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
}

function generateFileId(filePath: string): string {
    return Buffer.from(filePath).toString('base64');
}
