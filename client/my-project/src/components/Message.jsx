import React, { useState } from 'react';

const Message = ({ message }) => {
  const [artistsWithImages, setArtistsWithImages] = useState({});
  const [loading, setLoading] = useState({});

  const handleArtistClick = async (artist, visionAnalysis) => {
    try {
      if (loading[artist.id]) return;
      
      setLoading(prev => ({ ...prev, [artist.id]: true }));
      
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

      if (data.success && data.similarWorks) {
        setArtistsWithImages(prev => ({
          ...prev,
          [artist.id]: data.similarWorks.map(work => ({
            ...work,
            // עדכון הקישורים לתמונות
            thumbnailLink: `https://drive.google.com/thumbnail?id=${work.fileId}&sz=w400`,
            fullSizeLink: `https://drive.google.com/uc?id=${work.fileId}`
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching similar works:', error);
    } finally {
      setLoading(prev => ({ ...prev, [artist.id]: false }));
    }
  };

  return (
    <div className="flex gap-4 px-4">
      {/* Icon/Avatar */}
      <div className="w-8 h-8 flex-shrink-0">
        {message.type === 'assistant' ? (
          <img 
            src="/logo.png"
            alt="John Boy Tattoo Logo"
            className="w-8 h-8 object-contain rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-500 flex items-center justify-center">
            <span className="text-white text-sm">U</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-4">
        {message.image && (
          <img 
            src={message.image} 
            alt="Uploaded tattoo"
            className="max-w-md rounded-lg"
          />
        )}
        <div className="prose dark:prose-invert">
          {message.content}
        </div>
        
        {/* Analysis Results */}
        {message.analysis && (
          <div className="mt-4 space-y-2">
            <p className="font-medium">Style: {message.analysis.style}</p>
            <p>Confidence: {message.analysis.confidence}</p>
            <p>{message.analysis.reasoning}</p>
          </div>
        )}

        {/* Artists Section */}
        {message.artists && message.artists.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Matching Artists:</h3>
            <div className="space-y-4">
              {message.artists.map((artist) => (
                <div
                  key={artist.id}
                  className="block p-4 rounded-lg bg-gray-50 dark:bg-[#2c2c2e] 
                           hover:bg-gray-100 dark:hover:bg-[#3a3a3c] 
                           transition-colors duration-200"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleArtistClick(artist, message.visionAnalysis)}
                  >
                    <p className="font-medium text-lg mb-1">{artist.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Styles: {artist.styles.join(', ')}
                    </p>
                  </div>
                  
                  {loading[artist.id] && (
                    <div className="flex justify-center my-4">
                      <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {artistsWithImages[artist.id] && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {artistsWithImages[artist.id].map((work, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img 
                            src={work.thumbnailLink}
                            alt={`Work ${idx + 1} by ${artist.name}`}
                            className="w-full h-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null; // מניעת לולאה אינסופית
                              e.target.src = work.fullSizeLink;
                            }}
                          />
                          <a 
                            href={work.fullSizeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 
                                     hover:bg-opacity-50 transition-all duration-200 rounded-lg"
                          >
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                                         text-sm font-medium px-3 py-2 bg-black bg-opacity-75 rounded-full">
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