const db = require('../config/db.config');
const driveService = require('./drive.service');
const visionService = require('./vision.service');
const preferenceService = require('./preference.service');

class ArtistService {
  async findMatchingArtists(style, imageAnalysis) {
    try {
      console.log('🔍 Finding artists for style:', style);
      console.log('📊 Image Analysis:', JSON.stringify(imageAnalysis, null, 2));

      const { rows: artists } = await db.query(
        'SELECT * FROM artists WHERE $1 = ANY(styles)',
        [style]
      );
      console.log(`👥 Found ${artists.length} matching artists`);

      console.log('🖼️ Searching for similar works in artists portfolios...');
      const artistsWithWorks = await Promise.all(artists.map(async (artist) => {
        console.log(`📁 Processing portfolio for artist: ${artist.name}`);
        if (artist.google_drive_folder_id) {
          const similarWorks = await driveService.searchSimilarImages(
            artist.google_drive_folder_id,
            imageAnalysis
          );
          console.log(`✅ Found ${similarWorks.length} similar works for ${artist.name}`);
          
          // Check if artist is preferred
          const isPreferred = await preferenceService.isArtistPreferred(artist.id);
          
          return { 
            ...artist, 
            similarWorks,
            isPreferred 
          };
        }
        return { 
          ...artist, 
          similarWorks: [],
          isPreferred: false 
        };
      }));

      // Sort artists: preferred first, then by other criteria
      const sortedArtists = artistsWithWorks.sort((a, b) => {
        // First sort by preference
        if (a.isPreferred && !b.isPreferred) return -1;
        if (!a.isPreferred && b.isPreferred) return 1;
        
        // If both have same preference status, sort by number of similar works
        return (b.similarWorks?.length || 0) - (a.similarWorks?.length || 0);
      });

      console.log('🎯 Final results:', JSON.stringify(sortedArtists, null, 2));
      return sortedArtists;

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