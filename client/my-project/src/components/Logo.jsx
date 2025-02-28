const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo.png"
        alt="TattooAI Logo" 
        className="h-8 w-auto"
      />
      <span className="text-white text-xl font-medium">JOHN BOY TATTOO - Analyze BOT</span>
    </div>
  );
};

export default Logo;