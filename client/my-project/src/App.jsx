import Logo from './components/Logo';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar - אופציונלי */}
      {/* <div className="hidden md:flex md:w-[260px] bg-[#202123]">
        <div className="flex-1">
          // תוכן הסייד-בר
        </div>
      </div> */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-black border-b border-gray-800">
          <Logo />
          {/* אפשר להוסיף כפתורים נוספים בהדר */}
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

export default App;