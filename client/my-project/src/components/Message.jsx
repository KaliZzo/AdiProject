import React, { useState } from 'react';

const Message = ({ message }) => {
  const [artistsWithImages, setArtistsWithImages] = useState({});
  const [loading, setLoading] = useState({});

  const handleArtistClick = async (artist, visionAnalysis) => {
    try {
      // מניעת לחיצות כפולות
      if (loading[artist.id]) return;
      
      setLoading(prev => ({ ...prev, [artist.id]: true }));
      console.log('Fetching similar works for artist:', artist.name);
      
      const response = await fetch('http://localhost:5000/api/artists/similar-works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: artist.google_drive_folder_id,
          analysis: visionAnalysis
        })
      });

      const data = await response.json();
      console.log('Received data:', data);

      if (data.success && data.similarWorks) {
        setArtistsWithImages(prev => ({
          ...prev,
          [artist.id]: data.similarWorks
        }));
      }
    } catch (error) {
      console.error('Error fetching similar works:', error);
    } finally {
      setLoading(prev => ({ ...prev, [artist.id]: false }));
    }
  };

  // פונקציה להמרת קישור גוגל דרייב לקישור ישיר לתמונה
  const getDirectImageUrl = (fileId) => {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[80%] rounded-2xl p-4 space-y-3
        ${message.type === 'user' 
          ? 'bg-apple-blue text-white' 
          : 'bg-white dark:bg-[#3a3a3c] dark:text-white'}
      `}>
        {message.image && (
          <img 
            src={message.image} 
            alt="Uploaded tattoo"
            className="w-full max-h-96 object-cover rounded-lg"
          />
        )}
        <p>{message.content}</p>
        
        {message.analysis && (
          <div className="mt-2 space-y-1 text-sm opacity-90">
            <p>Style: {message.analysis.style}</p>
            <p>Confidence: {message.analysis.confidence}</p>
            <p>{message.analysis.reasoning}</p>
          </div>
        )}

        {message.artists && message.artists.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="font-medium mb-2">Matching Artists:</p>
            <div className="space-y-2">
              {message.artists.map((artist) => (
                <div
                  key={artist.id}
                  className="block p-3 rounded-lg bg-gray-50 dark:bg-[#2c2c2e] 
                           hover:bg-gray-100 dark:hover:bg-[#3a3a3c] 
                           transition-colors duration-200"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleArtistClick(artist, message.visionAnalysis)}
                  >
                    <p className="font-medium">{artist.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {artist.styles.join(', ')}
                    </p>
                  </div>
                  
                  {loading[artist.id] && (
                    <div className="flex justify-center mt-3">
                      <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {artistsWithImages[artist.id] && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {artistsWithImages[artist.id].map((work, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={work.thumbnailLink || work.webViewLink}
                            alt={work.name || `Similar work ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              console.log('Image load error, trying webViewLink');
                              if (e.target.src !== work.webViewLink) {
                                e.target.src = work.webViewLink;
                              } else {
                                e.target.src = '/placeholder-image.jpg';
                              }
                            }}
                          />
                          <a 
                            href={`https://drive.google.com/file/d/${work.fileId}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 rounded-lg group"
                          >
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              View Full Size
                            </span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;