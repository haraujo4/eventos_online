const minioClient = require('../config/minio');

class MinioService {
    constructor() {
        this.bucketVideos = 'videos';
        this.bucketThumbnails = 'thumbnails';
    }

    async ensureBucket(bucket) {
        try {
            const exists = await minioClient.bucketExists(bucket);
            if (!exists) {
                console.log(`Bucket ${bucket} missing. Creating...`);
                await minioClient.makeBucket(bucket, 'us-east-1');
            }

            
            
            const policy = {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucket}/*`]
                }]
            };
            await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
            console.log(`Bucket ${bucket} policy set to public.`);
        } catch (err) {
            console.error(`Error ensuring bucket ${bucket}:`, err);
            
            throw err;
        }
    }

    async uploadFile(bucket, filename, buffer, metaData = {}) {
        await this.ensureBucket(bucket);

        
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        const finalFilename = `${Date.now()}-${safeFilename}`;

        await minioClient.putObject(bucket, finalFilename, buffer, metaData);
        
        
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const host = process.env.MINIO_PUBLIC_HOST || process.env.MINIO_ENDPOINT;
        const port = process.env.MINIO_PORT;

        
        return `${protocol}://${host}:${port}/${bucket}/${finalFilename}`;
    }

    async uploadVideo(filename, buffer) {
        return this.uploadFile(this.bucketVideos, filename, buffer, { 'Content-Type': 'video/mp4' });
    }

    async uploadThumbnail(filename, buffer, contentType = 'image/jpeg') {
        return this.uploadFile(this.bucketThumbnails, filename, buffer, { 'Content-Type': contentType });
    }

    async uploadImage(filename, buffer, contentType) {
        return this.uploadFile(this.bucketThumbnails, filename, buffer, { 'Content-Type': contentType });
    }
}

module.exports = new MinioService();
