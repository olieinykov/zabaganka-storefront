"use client"

import { clx } from "@modules/common/components/ui"
import { KeyboardEvent, PointerEvent, useRef, useState } from "react"
import Volume from "@modules/common/icons/volume"
import VolumeLow from "@modules/common/icons/volume-low"
import VolumeOff from "@modules/common/icons/volume-off"

type VolumeControlProps = {
  volume: number
  isMuted: boolean
  canChangeVolume: boolean
  buttonClassName: string
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onDraggingChange: (isDragging: boolean) => void
}

const VOLUME_STEP = 0.05

const VolumeControl = ({
  volume,
  isMuted,
  canChangeVolume,
  buttonClassName,
  onToggleMute,
  onVolumeChange,
  onDraggingChange,
}: VolumeControlProps) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const level = isMuted ? 0 : volume
  const percent = Math.round(level * 100)

  const setDragging = (value: boolean) => {
    setIsDragging(value)
    onDraggingChange(value)
  }

  const setFromPointer = (clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    onVolumeChange(Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    setFromPointer(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging) setFromPointer(event.clientX)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next: Record<string, number | undefined> = {
      ArrowLeft: level - VOLUME_STEP,
      ArrowDown: level - VOLUME_STEP,
      ArrowRight: level + VOLUME_STEP,
      ArrowUp: level + VOLUME_STEP,
      Home: 0,
      End: 1,
    }
    const target = next[event.key]
    if (target === undefined) return

    event.preventDefault()
    event.stopPropagation()
    onVolumeChange(Math.min(Math.max(target, 0), 1))
  }

  const Icon =
    level === 0 ? VolumeOff : level < 0.5 ? VolumeLow : Volume

  return (
    <div className="group/volume relative shrink-0">
      {canChangeVolume && (
        <div
          className={clx(
            "absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-2 transition-[opacity,transform,visibility] duration-150 ease-out [@media(hover:none)]:hidden",
            isDragging
              ? "visible translate-y-0 opacity-100"
              : "invisible translate-y-1 opacity-0 group-hover/volume:visible group-hover/volume:translate-y-0 group-hover/volume:opacity-100 group-has-[:focus-visible]/volume:visible group-has-[:focus-visible]/volume:translate-y-0 group-has-[:focus-visible]/volume:opacity-100"
          )}
        >
          <div className="flex items-center rounded-circle border border-line bg-ivory px-3 py-1 shadow-sm">
            <div
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-label="Гучність"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={`${percent}%`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleKeyDown}
              className="group/vtrack relative flex h-6 w-20 cursor-pointer touch-none items-center rounded-circle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <div className="relative h-1 w-full overflow-hidden rounded-circle bg-graphite/25">
                <div
                  className="absolute inset-y-0 left-0 bg-gold"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span
                className={clx(
                  "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-circle border-2 border-ivory bg-gold shadow-sm transition-transform duration-150",
                  isDragging
                    ? "scale-125"
                    : "scale-100 group-hover/vtrack:scale-110"
                )}
                style={{ left: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={level === 0 ? "Увімкнути звук" : "Вимкнути звук"}
        onClick={onToggleMute}
        className={buttonClassName}
      >
        <Icon size={18} />
      </button>
    </div>
  )
}

export default VolumeControl
