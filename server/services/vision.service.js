const vision = require('@google-cloud/vision');

class VisionService {
  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: './config/gd-api-adi-c944e165a8e7.json'
    });
  }

  async analyzeImage(fileId) {
    try {
      const imageUrl = `https://drive.google.com/uc?id=${fileId}`;
      const [result] = await this.client.annotateImage({
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'IMAGE_PROPERTIES' }
        ]
      });

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