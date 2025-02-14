const db = require('../config/db.config');
const driveService = require('./drive.service');
const visionService = require('./vision.service');

class ArtistService {
  async findMatchingArtists(style, imageAnalysis) {
    try {
      // 1. מציאת אמנים שמתאימים לסגנון
      const { rows: artists } = await db.query(
        'SELECT * FROM artists WHERE $1 = ANY(styles)',
        [style]
      );

      // 2. עבור כל אמן, נחפש עבודות דומות
      const artistsWithWorks = await Promise.all(artists.map(async (artist) => {
        if (artist.google_drive_folder_id) {
          const similarWorks = await driveService.searchSimilarImages(
            artist.google_drive_folder_id,
            imageAnalysis
          );
          return { ...artist, similarWorks };
        }
        return { ...artist, similarWorks: [] };
      }));

      return artistsWithWorks;

    } catch (error) {
      console.error('Error finding matching artists:', error);
      throw error;
    }
  }

  async findSimilarWorks(folderId, imageAnalysis) {
    try {
      return await driveService.searchSimilarImages(folderId, imageAnalysis);
    } catch (error) {
      console.error('Error finding similar works:', error);
      return [];
    }
  }

  // פונקציה חדשה לחיפוש קעקוע דומה בתיקיית האמן
  async findSimilarTattoo(artistId, originalAnalysis) {
    try {
      // 1. קבלת ה-folder ID של האמן
      const { rows: [artist] } = await db.query(
        'SELECT google_drive_folder_id FROM artists WHERE id = $1',
        [artistId]
      );

      if (!artist?.google_drive_folder_id) {
        throw new Error('Artist folder not found');
      }

      // 2. קבלת כל התמונות מהתיקייה
      const folderImages = await driveService.getFolderImages(artist.google_drive_folder_id);

      // 3. ניתוח כל תמונה והשוואה לתמונה המקורית
      const similarityScores = await Promise.all(
        folderImages.map(async (image) => {
          const imageAnalysis = await visionService.analyzeImage(image.id);
          const similarity = this.calculateSimilarity(originalAnalysis, imageAnalysis);
          return {
            imageId: image.id,
            webViewLink: image.webViewLink,
            similarity
          };
        })
      );

      // 4. מיון לפי רמת הדמיון והחזרת התמונה הכי דומה
      const mostSimilar = similarityScores.sort((a, b) => b.similarity - a.similarity)[0];
      return mostSimilar;

    } catch (error) {
      console.error('Error finding similar tattoo:', error);
      throw error;
    }
  }

  // פונקציית עזר לחישוב דמיון
  calculateSimilarity(original, comparison) {
    let score = 0;
    
    // השוואת תגיות
    if (original.imageContent?.detectedLabels && comparison.detectedLabels) {
      const originalLabels = new Set(
        original.imageContent.detectedLabels.map(l => l.name.toLowerCase())
      );
      const comparisonLabels = new Set(
        comparison.detectedLabels.map(l => l.name.toLowerCase())
      );
      
      // חישוב חפיפה בין תגיות
      const intersection = [...originalLabels].filter(x => comparisonLabels.has(x));
      score += intersection.length * 2;
    }
    
    return score;
  }

  compareColors(original, comparison) {
    // השוואה פשוטה של צבעים דומיננטיים
    let similarity = 0;
    const originalColors = original.dominantColors.slice(0, 3);
    const comparisonColors = comparison.dominantColors.slice(0, 3);

    for (const oColor of originalColors) {
      for (const cColor of comparisonColors) {
        const colorDiff = Math.abs(oColor.rgb.red - cColor.rgb.red) +
                         Math.abs(oColor.rgb.green - cColor.rgb.green) +
                         Math.abs(oColor.rgb.blue - cColor.rgb.blue);
        if (colorDiff < 100) { // סף דמיון
          similarity += 1;
        }
      }
    }

    return similarity;
  }
}

module.exports = new ArtistService();