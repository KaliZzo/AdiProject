import { useState, useEffect } from 'react';

const ChatHistory = ({ onClose, onSelectConversation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/chat/history?limit=${limit}&offset=${page * limit}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.history.length < limit) {
          setHasMore(false);
        }
        
        if (page === 0) {
          setHistory(data.history);
        } else {
          setHistory(prev => [...prev, ...data.history]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleDeleteConversation = async (id, event) => {
    event.stopPropagation();
    
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      try {
        const response = await fetch('http://localhost:5000/api/chat/history', {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setHistory([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chat History</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {history.length > 0 ? (
        <>
          <div className="space-y-3">
            {history.map(item => (
              <div 
                key={item.id}
                className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => onSelectConversation(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium truncate">{item.user_message}</p>
                    <p className="text-sm text-gray-400 truncate">{item.assistant_response}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteConversation(item.id, e)}
                    className="text-gray-500 hover:text-red-500 ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {item.analyzed_style && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.analyzed_style.map((style, idx) => (
                      <span key={idx} className="text-xs bg-blue-900 text-blue-100 px-2 py-0.5 rounded-full">
                        {style}
                      </span>
                    ))}
                  </div>
                )}
                {item.image_url && (
                  <div className="mt-2">
                    <img 
                      src={item.image_url}
                      alt="Tattoo"
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-white"
            >
              Clear All History
            </button>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-gray-400">
          {loading ? (
            <div className="flex justify-center">
              <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <p>No chat history found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatHistory; 