"use client"

import { withFirstFrameHint } from "@lib/util/product-videos"
import { clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import ExitFullscreen from "@modules/common/icons/exit-fullscreen"
import Fullscreen from "@modules/common/icons/fullscreen"
import Pause from "@modules/common/icons/pause"
import Play from "@modules/common/icons/play"
import SpeedMenu, { PLAYBACK_RATES } from "./speed-menu"
import VolumeControl from "./volume-control"

type VideoPlayerProps = {
  src: string
  label: string
  isActive?: boolean
  hasPagination?: boolean
  className?: string
}

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
}

const HIDE_CONTROLS_DELAY_MS = 2500
const SEEK_STEP_SECONDS = 5
const VOLUME_KEY_STEP = 0.1
const DEFAULT_UNMUTE_VOLUME = 0.5

function detectVolumeSupport(): boolean {
  try {
    const probe = document.createElement("video")
    probe.volume = 0.5
    return probe.volume === 0.5
  } catch {
    return false
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00"
  }
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}

function getVideoDuration(video: HTMLVideoElement): number {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration
  }
  const { seekable } = video
  return seekable.length ? seekable.end(seekable.length - 1) : 0
}

const BACKDROP_DOWNSCALE = 12

const controlButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-circle text-ink interactive hover:bg-milk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"

const VideoPlayer = ({
  src,
  label,
  isActive = true,
  hasPagination = false,
  className,
}: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<WebkitVideoElement>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPointerTypeRef = useRef<string>("mouse")
  const menuWasOpenOnPointerDownRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [volume, setVolume] = useState(1)
  const [canChangeVolume, setCanChangeVolume] = useState(false)
  const [isVolumeDragging, setIsVolumeDragging] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false)

  useEffect(() => {
    setCanChangeVolume(detectVolumeSupport())
  }, [])

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const showControls = useCallback(() => {
    setControlsVisible(true)
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, HIDE_CONTROLS_DELAY_MS)
  }, [])

  useEffect(() => clearHideTimer, [])

  const syncDuration = useCallback((video: HTMLVideoElement) => {
    const next = getVideoDuration(video)
    setDuration((prev) => (prev === next ? prev : next))
  }, [])

  const drawBackdrop = useCallback(() => {
    const video = videoRef.current
    const canvas = backdropRef.current
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width: cw, height: ch } = canvas
    const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight)
    const sw = cw / scale
    const sh = ch / scale
    try {
      ctx.drawImage(
        video,
        (video.videoWidth - sw) / 2,
        (video.videoHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        cw,
        ch
      )
    } catch {
      // Frame not decodable yet - the plain background stays visible.
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (video.readyState >= 1) {
      syncDuration(video)
    }
    setIsMuted(video.muted)
    setVolume(video.volume)
    setPlaybackRate(video.playbackRate)
    if (video.error) {
      setHasError(true)
    }
  }, [syncDuration])

  useEffect(() => {
    const container = containerRef.current
    const canvas = backdropRef.current
    if (!container || !canvas) return

    const resize = () => {
      canvas.width = Math.max(
        1,
        Math.round(container.clientWidth / BACKDROP_DOWNSCALE)
      )
      canvas.height = Math.max(
        1,
        Math.round(container.clientHeight / BACKDROP_DOWNSCALE)
      )
      drawBackdrop()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [drawBackdrop])

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pause()
      setIsSpeedMenuOpen(false)
    }
  }, [isActive])

  useEffect(() => {
    if (!isPlaying || isScrubbing) {
      return
    }
    let frame = 0
    const tick = () => {
      const video = videoRef.current
      if (video) {
        setCurrentTime(video.currentTime)
        drawBackdrop()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying, isScrubbing, drawBackdrop])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!containerRef.current &&
          document.fullscreenElement === containerRef.current
      )
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused || video.ended) {
      video.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      video.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.muted || video.volume === 0) {
      if (video.volume === 0) video.volume = DEFAULT_UNMUTE_VOLUME
      video.muted = false
    } else {
      video.muted = true
    }
  }, [])

  const changeVolume = useCallback((value: number) => {
    const video = videoRef.current
    if (!video) return

    const next = Math.min(Math.max(value, 0), 1)
    video.volume = next
    video.muted = next === 0
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
  }, [])

  const stepPlaybackRate = (direction: -1 | 1) => {
    const index = PLAYBACK_RATES.findIndex((rate) => rate === playbackRate)
    const next = PLAYBACK_RATES[index + direction]
    if (index !== -1 && next !== undefined) changePlaybackRate(next)
  }

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    const video = videoRef.current

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
      return
    }
    if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => undefined)
      return
    }
    video?.webkitEnterFullscreen?.()
  }, [])

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    const total = video ? getVideoDuration(video) : 0
    if (!video || !total) return

    const clamped = Math.min(Math.max(time, 0), total)
    video.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  const seekToPointer = (clientX: number) => {
    const scrubber = scrubberRef.current
    if (!scrubber || !duration) return

    const rect = scrubber.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    seekTo(ratio * duration)
  }

  const handleScrubStart = (event: PointerEvent<HTMLDivElement>) => {
    if (!duration) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsScrubbing(true)
    seekToPointer(event.clientX)
  }

  const handleScrubMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    seekToPointer(event.clientX)
  }

  const handleScrubEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsScrubbing(false)
    showControls()
  }

  const handleScrubberKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keySeek: Record<string, number | undefined> = {
      ArrowLeft: currentTime - SEEK_STEP_SECONDS,
      ArrowDown: currentTime - SEEK_STEP_SECONDS,
      ArrowRight: currentTime + SEEK_STEP_SECONDS,
      ArrowUp: currentTime + SEEK_STEP_SECONDS,
      Home: 0,
      End: duration,
    }
    const target = keySeek[event.key]
    if (target === undefined) return

    event.preventDefault()
    event.stopPropagation()
    seekTo(target)
    showControls()
  }

  const handleContainerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return

    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault()
        togglePlay()
        break
      case "m":
        toggleMute()
        break
      case "f":
        toggleFullscreen()
        break
      case "ArrowLeft":
        event.preventDefault()
        seekTo(currentTime - SEEK_STEP_SECONDS)
        break
      case "ArrowRight":
        event.preventDefault()
        seekTo(currentTime + SEEK_STEP_SECONDS)
        break
      case "ArrowUp":
      case "ArrowDown":
        if (!canChangeVolume) return
        event.preventDefault()
        changeVolume(
          (isMuted ? 0 : volume) +
            (event.key === "ArrowUp" ? VOLUME_KEY_STEP : -VOLUME_KEY_STEP)
        )
        break
      case ">":
        stepPlaybackRate(1)
        break
      case "<":
        stepPlaybackRate(-1)
        break
      default:
        return
    }
    showControls()
  }

  const handleSurfaceClick = () => {
    if (menuWasOpenOnPointerDownRef.current) {
      menuWasOpenOnPointerDownRef.current = false
      return
    }
    if (
      lastPointerTypeRef.current === "touch" &&
      isPlaying &&
      !controlsVisible
    ) {
      showControls()
      return
    }
    togglePlay()
    showControls()
  }

  const toPercent = (value: number) =>
    duration > 0 ? Math.min(Math.max((value / duration) * 100, 0), 100) : 0
  const progress = toPercent(currentTime)
  const buffered = toPercent(bufferedEnd)
  const isUiVisible =
    !isPlaying ||
    controlsVisible ||
    isScrubbing ||
    isVolumeDragging ||
    isSpeedMenuOpen

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") showControls()
      }}
      onMouseLeave={() => {
        if (isPlaying && !isScrubbing && !isVolumeDragging) {
          clearHideTimer()
          setControlsVisible(false)
        }
      }}
      className={clx(
        "absolute inset-0 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60",
        isFullscreen ? "bg-ink" : "bg-milk",
        !isUiVisible && "cursor-none",
        className
      )}
    >
      <canvas
        ref={backdropRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 blur-xl brightness-95"
      />
      <video
        ref={videoRef}
        src={withFirstFrameHint(src)}
        preload="metadata"
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
        onLoadedData={drawBackdrop}
        onPlay={() => {
          setIsPlaying(true)
          setHasStarted(true)
          showControls()
        }}
        onPause={() => {
          setIsPlaying(false)
          setControlsVisible(true)
          clearHideTimer()
        }}
        onEnded={() => {
          setIsPlaying(false)
          setControlsVisible(true)
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onSeeked={() => {
          setIsBuffering(false)
          drawBackdrop()
        }}
        onLoadedMetadata={(event) => {
          syncDuration(event.currentTarget)
          setIsMuted(event.currentTarget.muted)
        }}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          syncDuration(event.currentTarget)
          if (!isScrubbing) setCurrentTime(event.currentTarget.currentTime)
        }}
        onProgress={(event) => {
          const { buffered: ranges, currentTime: time } = event.currentTarget
          for (let i = 0; i < ranges.length; i++) {
            if (ranges.start(i) <= time && time <= ranges.end(i)) {
              setBufferedEnd(ranges.end(i))
              return
            }
          }
        }}
        onVolumeChange={(event) => {
          setIsMuted(event.currentTarget.muted)
          setVolume(event.currentTarget.volume)
        }}
        onRateChange={(event) =>
          setPlaybackRate(event.currentTarget.playbackRate)
        }
        onError={() => {
          setHasError(true)
          setIsPlaying(false)
          setIsBuffering(false)
        }}
      />

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="font-ui text-sm text-graphite">
            Не вдалося відтворити відео
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onPointerDown={(event) => {
              lastPointerTypeRef.current = event.pointerType
              menuWasOpenOnPointerDownRef.current = isSpeedMenuOpen
            }}
            onClick={handleSurfaceClick}
            onDoubleClick={toggleFullscreen}
            className="absolute inset-0 h-full w-full cursor-pointer"
          />

          {isBuffering && isPlaying && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-circle border border-line bg-ivory/90 text-gold shadow-sm">
                <Spinner size={22} />
              </span>
            </div>
          )}

          {!isPlaying && !isScrubbing && (
            <button
              type="button"
              aria-label={hasStarted ? "Продовжити відео" : "Відтворити відео"}
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-circle border border-line bg-ivory/90 text-ink shadow-sm interactive hover:scale-105 hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Play size={24} />
            </button>
          )}

          <div
            className={clx(
              "absolute inset-x-3 flex items-center gap-1 rounded-circle border border-line bg-ivory/90 px-1.5 py-1 shadow-sm transition-opacity duration-300",
              hasPagination && !isFullscreen ? "bottom-14" : "bottom-3",
              isUiVisible && hasStarted
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <button
              type="button"
              aria-label={isPlaying ? "Пауза" : "Відтворити"}
              onClick={togglePlay}
              className={controlButtonClass}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <span className="w-10 shrink-0 text-right font-ui text-xs tabular-nums text-graphite">
              {formatTime(currentTime)}
            </span>

            <div
              ref={scrubberRef}
              role="slider"
              tabIndex={0}
              aria-label="Позиція відтворення"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration) || 0}
              aria-valuenow={Math.floor(currentTime)}
              aria-valuetext={`${formatTime(currentTime)} з ${formatTime(
                duration
              )}`}
              onPointerDown={handleScrubStart}
              onPointerMove={handleScrubMove}
              onPointerUp={handleScrubEnd}
              onPointerCancel={handleScrubEnd}
              onKeyDown={handleScrubberKeyDown}
              className="group/scrubber relative mx-1.5 flex h-6 min-w-0 flex-1 cursor-pointer touch-none items-center rounded-circle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <div className="relative h-1 w-full overflow-hidden rounded-circle bg-graphite/25">
                <div
                  className="absolute inset-y-0 left-0 bg-graphite/30"
                  style={{ width: `${buffered}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gold"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={clx(
                  "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-circle border-2 border-ivory bg-gold shadow-sm transition-transform duration-150",
                  isScrubbing
                    ? "scale-125"
                    : "scale-0 group-hover/scrubber:scale-100 group-focus-visible/scrubber:scale-100"
                )}
                style={{ left: `${progress}%` }}
              />
            </div>

            <span className="hidden w-10 shrink-0 font-ui text-xs tabular-nums text-graphite xsmall:block">
              {formatTime(duration)}
            </span>

            <SpeedMenu
              rate={playbackRate}
              isOpen={isSpeedMenuOpen}
              onOpenChange={setIsSpeedMenuOpen}
              onRateChange={changePlaybackRate}
            />

            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              canChangeVolume={canChangeVolume}
              buttonClassName={controlButtonClass}
              onToggleMute={toggleMute}
              onVolumeChange={changeVolume}
              onDraggingChange={setIsVolumeDragging}
            />

            <button
              type="button"
              aria-label={
                isFullscreen ? "Вийти з повноекранного режиму" : "На весь екран"
              }
              onClick={toggleFullscreen}
              className={controlButtonClass}
            >
              {isFullscreen ? (
                <ExitFullscreen size={18} />
              ) : (
                <Fullscreen size={18} />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default VideoPlayer
