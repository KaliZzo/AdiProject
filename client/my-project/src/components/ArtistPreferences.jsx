import { useState, useEffect } from 'react';

const ArtistPreferences = ({ onClose }) => {
  const [artists, setArtists] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch all artists
    const fetchArtists = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/artists');
        const data = await response.json();
        
        if (data.success) {
          setArtists(data.artists);
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    // Fetch current preferences
    const fetchPreferences = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/preferences');
        const data = await response.json();
        
        if (data.success) {
          // Convert array to object with artist_id as key
          const prefsObj = {};
          data.preferredArtists.forEach(pref => {
            prefsObj[pref.artist_id] = {
              isPreferred: pref.is_preferred,
              startTime: pref.priority_start_time,
              endTime: pref.priority_end_time
            };
          });
          setPreferences(prefsObj);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
    fetchPreferences();
  }, []);

  const handlePreferenceChange = (artistId) => {
    setPreferences(prev => {
      const currentPref = prev[artistId] || { isPreferred: false };
      return {
        ...prev,
        [artistId]: {
          ...currentPref,
          isPreferred: !currentPref.isPreferred
        }
      };
    });
  };

  const handleTimeChange = (artistId, field, value) => {
    setPreferences(prev => {
      const currentPref = prev[artistId] || { isPreferred: false };
      return {
        ...prev,
        [artistId]: {
          ...currentPref,
          [field]: value
        }
      };
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    
    try {
      // Save each preference
      for (const artistId in preferences) {
        const pref = preferences[artistId];
        
        if (pref.isPreferred) {
          await fetch(`http://localhost:5000/api/preferences/${artistId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isPreferred: true,
              startTime: pref.startTime || null,
              endTime: pref.endTime || null
            })
          });
        } else {
          // Remove preference if not preferred
          await fetch(`http://localhost:5000/api/preferences/${artistId}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Close the preferences panel
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Artist Preferences</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        {artists.map(artist => {
          const pref = preferences[artist.id] || { isPreferred: false };
          
          return (
            <div key={artist.id} className="p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{artist.name}</h3>
                  <p className="text-sm text-gray-400">
                    {artist.styles?.join(', ')}
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pref.isPreferred || false}
                    onChange={() => handlePreferenceChange(artist.id)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-sm font-medium">Preferred</span>
                </label>
              </div>
              
              {pref.isPreferred && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Priority Start Time
                    </label>
                    <input
                      type="time"
                      className="w-full bg-zinc-700 rounded px-3 py-2 text-white"
                      value={pref.startTime || ''}
                      onChange={(e) => handleTimeChange(artist.id, 'startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Priority End Time
                    </label>
                    <input
                      type="time"
                      className="w-full bg-zinc-700 rounded px-3 py-2 text-white"
                      value={pref.endTime || ''}
                      onChange={(e) => handleTimeChange(artist.id, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default ArtistPreferences; 