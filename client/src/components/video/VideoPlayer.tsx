import React, { useRef, useEffect, useState, useCallback } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Subtitles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { VideoPlayerProps, PlayerState } from "@/types";

// Advanced video player component with full controls and progress tracking
export function VideoPlayer({ 
  episode, 
  anime, 
  onProgressUpdate, 
  onEpisodeEnd, 
  onNextEpisode,
  initialProgress = 0 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null); // Video element reference
  const containerRef = useRef<HTMLDivElement>(null); // Container for fullscreen
  const progressTimerRef = useRef<NodeJS.Timeout>(); // Progress update timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(); // Controls auto-hide timer

  // Player state management
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    isMuted: false,
    isFullscreen: false,
    quality: "auto",
    playbackRate: 1,
    showControls: true,
  });

  const [isLoading, setIsLoading] = useState(true); // Video loading state
  const [hasError, setHasError] = useState(false); // Error state
  const [showQualityMenu, setShowQualityMenu] = useState(false); // Quality selector
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false); // Subtitles menu

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial time if provided
    if (initialProgress > 0) {
      video.currentTime = initialProgress;
    }

    // Video event handlers
    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({ ...prev, duration: video.duration }));
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime: video.currentTime 
      }));
    };

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      startProgressTracking();
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      stopProgressTracking();
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      stopProgressTracking();
      onEpisodeEnd?.();
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume * 100,
        isMuted: video.muted,
      }));
    };

    // Attach event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      // Cleanup event listeners
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
      stopProgressTracking();
    };
  }, [episode.videoUrl, initialProgress, onEpisodeEnd]);

  // Progress tracking for watch history
  const startProgressTracking = useCallback(() => {
    progressTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && onProgressUpdate) {
        const progress = video.currentTime;
        const completed = progress / video.duration > 0.9; // 90% completion threshold
        onProgressUpdate(progress, completed);
      }
    }, 5000); // Update every 5 seconds
  }, [onProgressUpdate]);

  const stopProgressTracking = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  }, []);

  // Controls auto-hide functionality
  const showControlsTemporarily = useCallback(() => {
    setPlayerState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (playerState.isPlaying) {
        setPlayerState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000); // Hide after 3 seconds of inactivity
  }, [playerState.isPlaying]);

  // Play/pause toggle
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    video.muted = newVolume === 0;
  };

  // Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setPlayerState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setPlayerState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  // Playback speed control
  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  // Error state
  if (hasError) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg font-medium mb-2">Failed to load video</p>
          <p className="text-sm text-gray-400">Please check your connection and try again</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
            data-testid="video-reload-button"
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playerState.isPlaying && setPlayerState(prev => ({ ...prev, showControls: false }))}
      data-testid="video-player-container"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={episode.videoUrl}
        className="w-full h-full object-contain"
        poster={episode.thumbnailUrl}
        preload="metadata"
        data-testid="video-element"
        onClick={togglePlayPause}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="loading-spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Play button overlay for paused state */}
      {!playerState.isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="w-20 h-20 rounded-full bg-primary/80 hover:bg-primary"
            onClick={togglePlayPause}
            data-testid="play-overlay-button"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          playerState.showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-6">
          
          {/* Progress bar */}
          <div className="mb-4">
            <Slider
              value={[progressPercentage]}
              onValueChange={([value]) => {
                const newTime = (value / 100) * playerState.duration;
                seekTo(newTime);
              }}
              className="cursor-pointer"
              data-testid="progress-slider"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span data-testid="current-time">{formatTime(playerState.currentTime)}</span>
              <span data-testid="total-duration">{formatTime(playerState.duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
                data-testid="play-pause-button"
              >
                {playerState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              {/* Skip backward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="skip-backward-button"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              {/* Skip forward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="skip-forward-button"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* Volume control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                  data-testid="mute-button"
                >
                  {playerState.isMuted || playerState.volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[playerState.isMuted ? 0 : playerState.volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    className="cursor-pointer"
                    data-testid="volume-slider"
                  />
                </div>
              </div>

              {/* Time display */}
              <span className="text-sm text-white/80" data-testid="time-display">
                {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              
              {/* Skip intro button (placeholder for future implementation) */}
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white"
                data-testid="skip-intro-button"
              >
                Skip Intro
              </Button>

              {/* Quality settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="quality-button"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Subtitles */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="subtitles-button"
              >
                <Subtitles className="w-5 h-5" />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="fullscreen-button"
              >
                {playerState.isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode info overlay */}
      <div className="absolute top-4 left-4 text-white">
        <h3 className="text-lg font-semibold" data-testid="episode-title">
          {anime.title}
        </h3>
        <p className="text-sm text-white/80" data-testid="episode-info">
          Episode {episode.episodeNumber}{episode.title ? ` - ${episode.title}` : ''}
        </p>
      </div>

      {/* Next episode button */}
      {onNextEpisode && (
        <div className="absolute top-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNextEpisode}
            className="bg-white/20 hover:bg-white/30 text-white"
            data-testid="next-episode-button"
          >
            Next Episode
          </Button>
        </div>
      )}
    </div>
  );
}

