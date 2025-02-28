const { google } = require('googleapis');
const path = require('path');
const vision = require('@google-cloud/vision');
const stream = require('stream');

class DriveService {
  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFilename: './config/gd-api-adi-c944e165a8e7.json',
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.visionClient = new vision.ImageAnnotatorClient({
      keyFilename: './config/gd-api-adi-c944e165a8e7.json'
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

  async uploadImage(buffer, filename) {
    try {
      // יצירת stream מה-buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const fileMetadata = {
        name: filename,
        parents: ['1pDs2a6RhGzmSJkQ4_MUWVvV-ZEVd-GpW']
      };

      const media = {
        mimeType: 'image/jpeg',
        body: bufferStream // שימוש ב-stream במקום ב-buffer ישירות
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      console.log('File uploaded successfully:', file.data);
      return file.data;
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

  async searchSimilarImages(folderId, originalAnalysis) {
    try {
      console.log('🔍 Starting similar images search in folder:', folderId);

      // 1. קבלת כל התמונות מהתיקייה
      const files = await this.getFolderContents(folderId);
      console.log(`📁 Found ${files.length} files in folder`);

      // 2. ניתוח והשוואת כל תמונה
      const similarityResults = await Promise.all(
        files.map(async (file) => {
          try {
            // קבלת התמונה מהדרייב
            const response = await this.drive.files.get({
              fileId: file.id,
              alt: 'media'
            }, { responseType: 'arraybuffer' });

            // ניתוח התמונה
            const analysis = await this.visionClient.annotateImage({
              image: { content: Buffer.from(response.data).toString('base64') },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES' }
              ]
            });

            // חישוב דמיון תגיות
            const labelSimilarity = this.calculateLabelSimilarity(
              originalAnalysis.imageContent.detectedLabels,
              analysis[0].labelAnnotations || []
            );

            // חישוב דמיון צבעים
            const colorSimilarity = this.calculateColorSimilarity(
              originalAnalysis.technicalAnalysis.colors.dominantColors,
              analysis[0].imagePropertiesAnnotation?.dominantColors?.colors || []
            );

            // חישוב ציון דמיון משוקלל
            const totalSimilarity = (labelSimilarity * 0.7) + (colorSimilarity * 0.3);

            return {
              fileId: file.id,
              name: file.name,
              webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
              thumbnailLink: `https://drive.google.com/thumbnail?id=${file.id}`,
              similarity: totalSimilarity,
              scores: {
                labelSimilarity,
                colorSimilarity
              }
            };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            return null;
          }
        })
      );

      // 3. סינון תוצאות לא תקינות ומיון לפי דמיון
      const validResults = similarityResults
        .filter(result => result !== null && result.similarity > 0.1) // סינון תוצאות עם דמיון נמוך מדי
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return validResults;

    } catch (error) {
      console.error('Error searching similar images:', error);
      throw error;
    }
  }

  calculateLabelSimilarity(originalLabels, comparisonLabels) {
    if (!originalLabels?.length || !comparisonLabels?.length) return 0;

    const originalSet = new Set(originalLabels.map(l => l.description.toLowerCase()));
    const comparisonSet = new Set(comparisonLabels.map(l => l.description.toLowerCase()));

    const intersection = [...originalSet].filter(x => comparisonSet.has(x));
    const union = new Set([...originalSet, ...comparisonSet]);

    return intersection.length / union.size; // Jaccard similarity
  }

  calculateColorSimilarity(originalColors, comparisonColors) {
    if (!originalColors?.length || !comparisonColors?.length) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    // השוואת הצבעים הדומיננטיים ביותר (עד 3)
    const topOriginalColors = originalColors.slice(0, 3);
    const topComparisonColors = comparisonColors.slice(0, 3);

    topOriginalColors.forEach(origColor => {
      topComparisonColors.forEach(compColor => {
        // חישוב מרחק RGB מנורמל
        const distance = Math.sqrt(
          Math.pow(origColor.color.red - compColor.color.red, 2) +
          Math.pow(origColor.color.green - compColor.color.green, 2) +
          Math.pow(origColor.color.blue - compColor.color.blue, 2)
        );

        // נרמול התוצאה ל-0 עד 1
        const similarity = 1 - (distance / 441.67); // sqrt(255^2 + 255^2 + 255^2)
        totalSimilarity += similarity * origColor.score * compColor.score; // משקלל לפי חשיבות הצבע
        comparisons++;
      });
    });

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  calculateImageSimilarity(original, comparison) {
    try {
      console.log('Calculating similarity between:', {
        original: JSON.stringify(original, null, 2),
        comparison: JSON.stringify(comparison, null, 2)
      });

      let score = 0;

      // בדיקת תקינות הנתונים
      if (!comparison?.detectedLabels || comparison.detectedLabels.length === 0) {
        console.warn('No labels detected in comparison image');
        return 0;
      }

      if (!original?.imageContent?.detectedLabels || original.imageContent.detectedLabels.length === 0) {
        console.warn('No labels detected in original image');
        return 0;
      }

      // השוואת תגיות
      const originalLabels = new Set(
        original.imageContent.detectedLabels.map(l => l.name.toLowerCase())
      );
      const comparisonLabels = new Set(
        comparison.detectedLabels.map(l => l.description.toLowerCase())
      );

      // חישוב חפיפה
      const intersection = [...originalLabels].filter(x => comparisonLabels.has(x));
      score += intersection.length * 2;

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
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 50
      });

      return response.data.files;
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