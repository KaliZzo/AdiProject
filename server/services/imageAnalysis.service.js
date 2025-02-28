const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

class ImageAnalysisService {
  constructor() {
    try {
      const credentialsPath = './config/gd-api-adi-c944e165a8e7.json';
      
      // Check if credentials file exists
      if (fs.existsSync(credentialsPath)) {
        this.client = new vision.ImageAnnotatorClient({
          keyFilename: credentialsPath
        });
        this.useMock = false;
      } else {
        console.warn('Google Cloud credentials file not found. Using mock data for image analysis.');
        this.useMock = true;
      }
    } catch (error) {
      console.warn('Error initializing Vision API client:', error);
      this.useMock = true;
    }
  }

  async analyzeImage(imageBuffer) {
    try {
      console.log('🔍 Starting image analysis...');
      
      if (this.useMock) {
        return this.getMockAnalysis();
      }
      
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'IMAGE_PROPERTIES' }
        ]
      });

      console.log('🏷️ Detected Labels:', JSON.stringify(result.labelAnnotations, null, 2));
      console.log('🎯 Detected Objects:', JSON.stringify(result.localizedObjectAnnotations, null, 2));
      console.log('🎨 Color Analysis:', JSON.stringify(result.imagePropertiesAnnotation?.dominantColors?.colors, null, 2));

      const analysis = {
        imageContent: {
          detectedLabels: result.labelAnnotations || [],
          detectedObjects: result.localizedObjectAnnotations || []
        },
        technicalAnalysis: {
          colors: {
            dominantColors: result.imagePropertiesAnnotation?.dominantColors?.colors || []
          }
        }
      };

      console.log('✅ Analysis complete:', JSON.stringify(analysis, null, 2));
      return analysis;
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Return mock data in case of error
      return this.getMockAnalysis();
    }
  }

  getMockAnalysis() {
    console.log('Using mock data for image analysis');
    
    // Mock data for image analysis
    return {
      imageContent: {
        detectedLabels: [
          { description: 'Tattoo', score: 0.95 },
          { description: 'Art', score: 0.92 },
          { description: 'Design', score: 0.89 },
          { description: 'Black', score: 0.85 },
          { description: 'Line art', score: 0.82 }
        ],
        detectedObjects: [
          { name: 'Art', score: 0.9 }
        ]
      },
      technicalAnalysis: {
        colors: {
          dominantColors: [
            { 
              color: { red: 0, green: 0, blue: 0 },
              pixelFraction: 0.8,
              score: 0.9
            },
            {
              color: { red: 255, green: 255, blue: 255 },
              pixelFraction: 0.2,
              score: 0.1
            }
          ]
        }
      }
    };
  }

  // Helper methods
  isMonochromatic(colors) {
    if (!colors?.length) return false;
    const threshold = 30;
    const firstColor = colors[0].color;
    return colors.every(color => {
      const diff = Math.abs(color.color.red - firstColor.red) +
                  Math.abs(color.color.green - firstColor.green) +
                  Math.abs(color.color.blue - firstColor.blue);
      return diff < threshold;
    });
  }

  calculateAverageBrightness(colors) {
    if (!colors?.length) return 0;
    return colors.reduce((sum, color) => {
      const brightness = (color.color.red + color.color.green + color.color.blue) / 3;
      return sum + (brightness * color.pixelFraction);
    }, 0);
  }

  calculateContrast(colors) {
    if (!colors?.length || colors.length < 2) return 0;
    const brightnesses = colors.map(color => 
      (color.color.red + color.color.green + color.color.blue) / 3
    );
    return Math.max(...brightnesses) - Math.min(...brightnesses);
  }

  analyzeDetailLevel(labels) {
    if (!labels?.length) return 'basic';
    const detailIndicators = labels.filter(label => 
      label.description.toLowerCase().includes('detailed') ||
      label.description.toLowerCase().includes('complex') ||
      label.description.toLowerCase().includes('intricate')
    );
    if (detailIndicators.length > 2) return 'high';
    if (detailIndicators.length > 0) return 'medium';
    return 'basic';
  }

  calculateVisualDensity(colors) {
    if (!colors?.length) return 'low';
    const uniqueColors = new Set(colors.map(c => 
      `${c.color.red}-${c.color.green}-${c.color.blue}`
    )).size;
    if (uniqueColors > 10) return 'high';
    if (uniqueColors > 5) return 'medium';
    return 'low';
  }
}

module.exports = new ImageAnalysisService(); 