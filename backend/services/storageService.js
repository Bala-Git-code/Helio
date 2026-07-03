const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    this.uploadDir = path.join(__dirname, '../storage/uploads');
    
    if (this.provider === 'local') {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(fileName, buffer) {
    console.log(`[StorageService] Uploading file using provider: ${this.provider}`);
    const fileId = `file-${Date.now()}-${fileName}`;

    if (this.provider === 'cloudinary') {
      // Cloudinary cloud upload simulation
      return {
        fileId,
        url: `https://res.cloudinary.com/helio/image/upload/v1/${fileId}`,
        provider: 'cloudinary'
      };
    }

    if (this.provider === 's3') {
      // AWS S3 cloud bucket upload simulation
      return {
        fileId,
        url: `https://helio-clinical-vault.s3.amazonaws.com/documents/${fileId}`,
        provider: 's3'
      };
    }

    // Default Local storage
    const filePath = path.join(this.uploadDir, fileId);
    await fs.promises.writeFile(filePath, buffer);
    return {
      fileId,
      url: `/storage/uploads/${fileId}`,
      provider: 'local',
      localPath: filePath
    };
  }

  async deleteFile(fileId) {
    console.log(`[StorageService] Deleting file ID: ${fileId} using provider: ${this.provider}`);
    
    if (this.provider === 'local') {
      const filePath = path.join(this.uploadDir, fileId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    }
    
    return true; // Cloud simulation completes immediately
  }

  async getDownloadStream(fileId) {
    if (this.provider === 'local') {
      const filePath = path.join(this.uploadDir, fileId);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath);
      }
    }
    throw new Error('Streaming not available for cloud simulation nodes.');
  }
}

module.exports = new StorageService();
