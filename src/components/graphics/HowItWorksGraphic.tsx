import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const HowItWorksGraphic: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const steps = [
    {
      id: 1,
      title: "URL oder Text einfügen",
      description: "Füge eine URL ein oder kopiere deinen Newsletter direkt ins Textfeld",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/1-URL-einf%C3%BCgen.jpg",
      color: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-500/20"
    },
    {
      id: 2,
      title: "Content wird extrahiert",
      description: "Der Inhalt deines Blogposts oder Newsletters wird automatisch erkannt",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/2-Inhalt-Blogpost-Newsletter-eingef%C3%BCgt.jpg",
      color: "from-purple-500/10 to-purple-600/10",
      borderColor: "border-purple-500/20"
    },
    {
      id: 3,
      title: "Plattform auswählen",
      description: "Wähle zwischen LinkedIn, X (Twitter) oder Instagram",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/3-Social-Media-Plattform-selektieren.jpg",
      color: "from-primary/10 to-accent/10",
      borderColor: "border-primary/20"
    },
    {
      id: 4,
      title: "Multiple Posts generiert",
      description: "OpenRouter AI erstellt mehrere optimierte Post-Varianten für dich",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/4-multiple-posts-erstellt.jpg",
      color: "from-green-500/10 to-green-600/10",
      borderColor: "border-green-500/20"
    },
    {
      id: 5,
      title: "Posts bearbeiten",
      description: "Passe die generierten Posts nach deinen Wünschen an",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/5-editieren-von-posts.jpg",
      color: "from-orange-500/10 to-orange-600/10",
      borderColor: "border-orange-500/20"
    },
    {
      id: 6,
      title: "Posts speichern",
      description: "Speichere deine Lieblingsposts für später",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/6-posts-speichern.jpg",
      color: "from-indigo-500/10 to-indigo-600/10",
      borderColor: "border-indigo-500/20"
    },
    {
      id: 7,
      title: "Direkt posten",
      description: "Teile deine Posts direkt auf den Plattformen oder kopiere sie",
      image: "https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/7-posten.jpg",
      color: "from-pink-500/10 to-pink-600/10",
      borderColor: "border-pink-500/20"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const handlePrevious = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const handleStepClick = (index: number) => {
    setIsPlaying(false);
    setCurrentStep(index);
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  return (
    <div className="relative w-full">
      {/* Desktop version */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Image container with aspect ratio */}
          <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Loading skeleton */}
            {!imageLoaded[currentStep] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg w-full h-full" />
              </div>
            )}
            
            {/* Main image */}
            <img
              src={steps[currentStep].image}
              alt={steps[currentStep].title}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                imageLoaded[currentStep] ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => handleImageLoad(currentStep)}
            />

            {/* Navigation arrows */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition-transform duration-200"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition-transform duration-200"
              aria-label="Next step"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition-transform duration-200"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Step information and indicators */}
          <div className="p-6">
            {/* Step title and description */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-bold">
                  {steps[currentStep].id}
                </span>
                {steps[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-gradient-to-r from-primary to-accent'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Go to step ${step.id}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version */}
      <div className="block lg:hidden">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Image container */}
          <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Loading skeleton */}
            {!imageLoaded[currentStep] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg w-full h-full" />
              </div>
            )}
            
            {/* Main image */}
            <img
              src={steps[currentStep].image}
              alt={steps[currentStep].title}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                imageLoaded[currentStep] ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => handleImageLoad(currentStep)}
            />

            {/* Mobile navigation overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? 'w-6 bg-white'
                          : 'bg-white/50'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2"
                  aria-label="Next step"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Step information */}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
                {steps[currentStep].id}
              </span>
              {steps[currentStep].title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksGraphic;
