import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Share2, 
  Maximize2,
  X,
  SkipBack,
  SkipForward
} from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'audio' | 'video' | 'image';
  url: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  metadata?: any;
}

interface MediaViewerProps {
  media: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function MediaViewer({ 
  media, 
  currentIndex, 
  onClose, 
  onIndexChange 
}: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMedia = media[currentIndex];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousMedia();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMedia();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    // Reset state when media changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentIndex]);

  const togglePlayPause = () => {
    const mediaElement = currentMedia.type === 'audio' ? audioRef.current : videoRef.current;
    
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const mediaElement = currentMedia.type === 'audio' ? audioRef.current : videoRef.current;
    
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
      setDuration(mediaElement.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = currentMedia.type === 'audio' ? audioRef.current : videoRef.current;
    const newTime = parseFloat(e.target.value);
    
    if (mediaElement) {
      mediaElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const mediaElement = currentMedia.type === 'audio' ? audioRef.current : videoRef.current;
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (mediaElement) {
      mediaElement.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const mediaElement = currentMedia.type === 'audio' ? audioRef.current : videoRef.current;
    
    if (mediaElement) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      mediaElement.volume = newMuted ? 0 : volume;
    }
  };

  const previousMedia = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const nextMedia = () => {
    if (currentIndex < media.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = currentMedia.url;
    link.download = currentMedia.title || `media-${currentMedia.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareMedia = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentMedia.title || 'Media Content',
          url: currentMedia.url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentMedia.url);
    }
  };

  if (!currentMedia) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-semibold">
              {currentMedia.title || `Media ${currentIndex + 1}`}
            </h3>
            <p className="text-sm opacity-75">
              {currentIndex + 1} of {media.length}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={downloadMedia}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={shareMedia}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {currentMedia.type === 'video' && (
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentMedia.type === 'image' && (
          <img
            src={currentMedia.url}
            alt={currentMedia.title}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {currentMedia.type === 'audio' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md w-full">
            <audio
              ref={audioRef}
              src={currentMedia.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="text-center text-white mb-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-12 h-12" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Audio Briefing</h4>
              <p className="text-sm opacity-75">
                {currentMedia.title || 'News Audio Content'}
              </p>
            </div>

            {/* Audio Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/75 w-12">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-white/75 w-12">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={previousMedia}
                  disabled={currentIndex === 0}
                  className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={nextMedia}
                  disabled={currentIndex === media.length - 1}
                  className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1 text-white hover:bg-white/20 rounded"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {currentMedia.type === 'video' && (
          <div className="relative max-w-full max-h-full">
            <video
              ref={videoRef}
              src={currentMedia.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="max-w-full max-h-full"
              controls={false}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <span className="w-12">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayPause}
                      className="p-2 text-white hover:bg-white/20 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleMute}
                        className="p-1 text-white hover:bg-white/20 rounded"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={previousMedia}
                      disabled={currentIndex === 0}
                      className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-50"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={nextMedia}
                      disabled={currentIndex === media.length - 1}
                      className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-50"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
