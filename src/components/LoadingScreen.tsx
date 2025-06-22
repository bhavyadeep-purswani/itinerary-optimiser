import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[51] flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: "1.5s", animationDuration: "4s" }}
        ></div>
      </div>

      {/* Main Animation Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Central Loading Animation */}
        <div className="relative mb-12">
          {/* Outer Ring */}
          <div className="w-32 h-32 border-4 border-white/20 rounded-full"></div>

          {/* Middle Spinning Ring */}
          <div className="absolute inset-2 w-28 h-28 border-4 border-t-white border-r-white/70 border-b-white/40 border-l-white/20 rounded-full animate-spin"></div>

          {/* Inner Pulsing Ring */}
          <div className="absolute inset-6 w-20 h-20 border-2 border-white/60 rounded-full animate-pulse"></div>

          {/* Center Orb */}
          <div className="absolute inset-12 w-8 h-8 bg-gradient-to-br from-white to-white/70 rounded-full animate-pulse shadow-lg"></div>

          {/* Orbiting Dots */}
          <div className="absolute inset-0 w-32 h-32">
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2 animate-spin"
              style={{ transformOrigin: "50% 64px", animationDuration: "2s" }}
            ></div>
            <div
              className="absolute top-0 left-1/2 w-2 h-2 bg-white/70 rounded-full transform -translate-x-1/2 animate-spin"
              style={{
                transformOrigin: "50% 64px",
                animationDuration: "3s",
                animationDelay: "0.5s",
              }}
            ></div>
            <div
              className="absolute top-0 left-1/2 w-2 h-2 bg-white/50 rounded-full transform -translate-x-1/2 animate-spin"
              style={{
                transformOrigin: "50% 64px",
                animationDuration: "4s",
                animationDelay: "1s",
              }}
            ></div>
          </div>
        </div>

        {/* Animated Text Section */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2
              className="text-3xl font-bold text-white opacity-0 animate-pulse"
              style={{
                animation: "fadeInUp 1s ease-out forwards",
                animationDelay: "0.2s",
              }}
            >
              Creating Your Perfect Itinerary
            </h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white to-transparent mx-auto animate-pulse"></div>
          </div>

          <div
            className="space-y-2 opacity-0"
            style={{
              animation: "fadeInUp 1s ease-out forwards",
              animationDelay: "0.7s",
            }}
          >
            <p className="text-white/90 text-lg leading-relaxed">
              We're analyzing your preferences and crafting
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              a personalized travel experience...
            </p>
          </div>

          {/* Progress Indicator */}
          <div
            className="space-y-4 opacity-0"
            style={{
              animation: "fadeInUp 1s ease-out forwards",
              animationDelay: "1.2s",
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes progressBar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;
