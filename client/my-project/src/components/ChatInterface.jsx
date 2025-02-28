import { useState, useRef, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import Message from './Message';
import ArtistPreferences from './ArtistPreferences';
import ChatHistory from './ChatHistory';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/tattoo/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newMessages = [
          {
            type: 'user',
            content: 'Analyzing this tattoo...',
            image: URL.createObjectURL(file)
          },
          {
            type: 'assistant',
            content: `This appears to be a ${data.styleAnalysis.style} style tattoo.`,
            analysis: data.styleAnalysis,
            visionAnalysis: data.visionAnalysis,
            artists: data.artists,
            imageUrl: data.imageUrl
          }
        ];

        await fetch('http://localhost:5000/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage: 'Analyzing this tattoo...',
            assistantResponse: `This appears to be a ${data.styleAnalysis.style} style tattoo.`,
            imageUrl: data.imageUrl,
            analyzedStyle: [data.styleAnalysis.style]
          })
        });

        setMessages(prev => [...prev, ...newMessages]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Sorry, there was an error analyzing your image. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreferences = () => {
    setShowPreferences(prev => !prev);
    if (showHistory) setShowHistory(false);
  };

  const toggleHistory = () => {
    setShowHistory(prev => !prev);
    if (showPreferences) setShowPreferences(false);
  };

  const handleSelectConversation = (conversation) => {
    // Create messages from the conversation
    const newMessages = [
      {
        type: 'user',
        content: conversation.user_message,
        image: conversation.image_url
      },
      {
        type: 'assistant',
        content: conversation.assistant_response,
        imageUrl: conversation.image_url,
        analysis: conversation.analyzed_style ? { style: conversation.analyzed_style[0] } : null
      }
    ];

    setMessages(newMessages);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header Buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={handleNewChat}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
        <button
          onClick={toggleHistory}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          History
        </button>
        <button
          onClick={togglePreferences}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Preferences
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mt-16">
        <div className="max-w-3xl mx-auto px-4">
          {messages.length === 0 && !isLoading && (
            <div className="py-20 text-center text-gray-400">
              <h2 className="text-2xl font-bold mb-2">Welcome to Tattoo Analyzer</h2>
              <p>Upload a tattoo image to get started</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`py-6 ${
              message.type === 'assistant' ? 'bg-zinc-900' : ''
            }`}>
              <div className="max-w-3xl mx-auto">
                <Message message={message} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="py-6 bg-zinc-900">
              <div className="max-w-3xl mx-auto flex justify-center">
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <ArtistPreferences onClose={() => setShowPreferences(false)} />
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <ChatHistory 
              onClose={() => setShowHistory(false)} 
              onSelectConversation={handleSelectConversation}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-black">
        <div className="max-w-3xl mx-auto p-4">
          <ImageUpload onUpload={handleImageUpload} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;