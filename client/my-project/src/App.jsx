import ChatInterface from './components/ChatInterface';
import Logo from './components/Logo';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-apple-dark transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Logo />
        <ChatInterface />
      </div>
    </div>
  );
}

export default App;