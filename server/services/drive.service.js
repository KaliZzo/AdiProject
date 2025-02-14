const { google } = require('googleapis');
const path = require('path');
const visionService = require('./vision.service');
const vision = require('@google-cloud/vision');

class DriveService {
  constructor() {
    this.drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        keyFile: './config/gd-api-adi-c944e165a8e7.json',
        scopes: ['https://www.googleapis.com/auth/drive']
      })
    });
  }

  async createArtistFolder(artistName) {
    try {
      const folderMetadata = {
        name: `Portfolio-${artistName}`, 
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error creating artist folder:', error);
      throw error;
    }
  }

  async uploadImage(buffer, filename, folderId = null) {
    try {
      const fileMetadata = {
        name: filename,
        mimeType: 'image/jpeg'
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: bufferStream
        },
        fields: 'id,webViewLink'
      });

      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink
      };
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      throw error;
    }
  }

  async getImagesFromFolder(folderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/'`,
        fields: 'files(id, name, webViewLink)',
        pageSize: 10 // מגביל ל-10 תמונות לדוגמא
      });

      return response.data.files;
    } catch (error) {
      console.error('Error getting images from folder:', error);
      throw error;
    }
  }

  async getImageUrl(fileId) {
    try {
      // בדיקה אם כבר יש הרשאות צפייה
      const permissions = await this.drive.permissions.list({
        fileId: fileId
      });

      // אם אין הרשאות צפייה פומביות, נוסיף
      if (!permissions.data.permissions.some(p => p.type === 'anyone')) {
        await this.drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      }
      
      const result = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink,thumbnailLink'
      });
      
      return {
        webViewLink: result.data.webViewLink,
        thumbnailLink: result.data.thumbnailLink
      };
    } catch (error) {
      console.error('Error getting Drive link:', error);
      throw error;
    }
  }

  async searchSimilarImages(folderId, analysis) {
    try {
      console.log('Starting search with analysis:', JSON.stringify(analysis, null, 2));
      
      // 1. קבלת כל התמונות מהתיקייה
      const files = await this.getFolderContents(folderId);
      console.log('Found files:', files.length);

      // 2. ניתוח והשוואה של כל תמונה
      const similarityResults = await Promise.all(
        files.map(async (file) => {
          try {
            if (file.mimeType.startsWith('image/')) {
              // ניתוח התמונה עם Vision API
              const imageAnalysis = await visionService.analyzeImage(file.id);
              console.log('Image analysis for file:', file.id, imageAnalysis);

              // חישוב דמיון
              const similarity = this.calculateImageSimilarity(analysis, imageAnalysis);
              return {
                fileId: file.id,
                webViewLink: file.webViewLink,
                similarity
              };
            }
            return null;
          } catch (error) {
            console.error(`Error processing file ${file.id}:`, error);
            return null;
          }
        })
      );

      // 3. סינון ומיון התוצאות
      const validResults = similarityResults
        .filter(result => result !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      console.log('Final results:', validResults);
      return validResults;

    } catch (error) {
      console.error('Error searching similar images:', error);
      throw error;
    }
  }

  calculateImageSimilarity(original, comparison) {
    try {
      console.log('Calculating similarity between:', {
        original: JSON.stringify(original, null, 2),
        comparison: JSON.stringify(comparison, null, 2)
      });

      let score = 0;

      // בדיקת תקינות הנתונים
      if (!original?.imageContent?.detectedLabels || !comparison?.detectedLabels) {
        console.warn('Missing required data for similarity calculation');
        return 0;
      }

      // השוואת תגיות
      const originalLabels = new Set(
        original.imageContent.detectedLabels.map(l => l.name.toLowerCase())
      );
      const comparisonLabels = new Set(
        comparison.detectedLabels.map(l => l.name.toLowerCase())
      );

      // חישוב חפיפה
      const intersection = [...originalLabels].filter(x => comparisonLabels.has(x));
      score += intersection.length * 2;

      // השוואת צבעים אם קיימים
      if (original.technicalAnalysis?.colors?.dominantColors && 
          comparison.technicalAnalysis?.colors?.dominantColors) {
        const colorSimilarity = this.compareColors(
          original.technicalAnalysis.colors.dominantColors,
          comparison.technicalAnalysis.colors.dominantColors
        );
        score += colorSimilarity;
      }

      return score;
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }

  compareColors(colors1, colors2) {
    try {
      let similarity = 0;
      const mainColors1 = colors1.slice(0, 3);
      const mainColors2 = colors2.slice(0, 3);

      for (const c1 of mainColors1) {
        for (const c2 of mainColors2) {
          const colorDiff = Math.abs(c1.color.red - c2.color.red) +
                           Math.abs(c1.color.green - c2.color.green) +
                           Math.abs(c1.color.blue - c2.color.blue);
          if (colorDiff < 100) {
            similarity += (100 - colorDiff) / 100;
          }
        }
      }
      return similarity;
    } catch (error) {
      console.error('Error comparing colors:', error);
      return 0;
    }
  }

  async getFolderContents(folderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink)',
      });

      console.log('API Response:', response.data);
      return response.data.files || [];
    } catch (error) {
      console.error('Error getting folder contents:', error);
      throw error;
    }
  }

  // פונקציה חדשה להוספת הרשאות
  async addPermission(fileId) {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('Added public permission to:', fileId);
    } catch (error) {
      console.error('Error adding permission:', error);
      throw error;
    }
  }
}

module.exports = new DriveService(); 