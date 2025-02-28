import { useState, useRef, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import Message from './Message';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
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