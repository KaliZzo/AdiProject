const Message = ({ message }) => {
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
              <p>Confidence: {message.analysis.confidence}</p>
              <p>{message.analysis.reasoning}</p>
            </div>
          )}
  
          {message.artists && message.artists.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="font-medium mb-2">Matching Artists:</p>
              <div className="space-y-2">
                {message.artists.map((artist, index) => (
                  <a
                    key={index}
                    href={artist.portfolio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-[#2c2c2e] 
                             hover:bg-gray-100 dark:hover:bg-[#3a3a3c] 
                             transition-colors duration-200"
                  >
                    <p className="font-medium">{artist.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {artist.styles.join(', ')}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default Message;