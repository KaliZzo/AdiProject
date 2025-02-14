const vision = require('@google-cloud/vision');
const { Readable } = require('stream');
const { google } = require('googleapis');

class VisionService {
  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: './config/gd-api-adi-c944e165a8e7.json'
    });
    
    this.drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        keyFilename: './config/gd-api-adi-c944e165a8e7.json',
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      })
    });
  }

  async analyzeImage(fileId) {
    try {
      // קבלת התמונה מהדרייב
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' });

      // ניתוח התמונה
      const [result] = await this.client.annotateImage({
        image: { content: Buffer.from(response.data).toString('base64') },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'OBJECT_LOCALIZATION' }
        ]
      });

      console.log('Vision API result:', JSON.stringify(result, null, 2));

      return {
        detectedLabels: result.labelAnnotations || [],
        technicalAnalysis: {
          colors: {
            dominantColors: result.imagePropertiesAnnotation?.dominantColors?.colors || []
          }
        }
      };

    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}

module.exports = new VisionService(); 