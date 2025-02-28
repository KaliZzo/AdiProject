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

  async analyzeImage(imageBuffer) {
    try {
      // ניתוח התמונה ישירות מה-buffer
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'OBJECT_LOCALIZATION' }
        ]
      });

      console.log('Vision API result:', JSON.stringify(result, null, 2));

      // וידוא שיש לנו את כל המידע הנדרש
      if (!result.labelAnnotations || !result.imagePropertiesAnnotation?.dominantColors?.colors) {
        throw new Error('Missing required image analysis data');
      }

      return {
        detectedLabels: result.labelAnnotations,
        technicalAnalysis: {
          colors: {
            dominantColors: result.imagePropertiesAnnotation.dominantColors.colors
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