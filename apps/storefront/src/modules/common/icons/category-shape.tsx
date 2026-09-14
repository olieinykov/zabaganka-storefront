import { IconProps } from "../../../types/icon"

type Shape = "diamond" | "circle" | "square"

const SHAPES: Shape[] = ["diamond", "circle", "square"]

/** Cycles through diamond/circle/square so consecutive cards look varied. */
export function shapeForIndex(index: number): Shape {
  return SHAPES[index % SHAPES.length]
}

export default function CategoryShape({
  shape,
  size = 64,
  color = "#5e5b56",
  ...attributes
}: IconProps & { shape: Shape }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      {shape === "diamond" && (
        <rect
          x="14"
          y="14"
          width="36"
          height="36"
          rx="2"
          transform="rotate(45 32 32)"
          stroke={color}
          strokeWidth="2"
        />
      )}
      {shape === "circle" && (
        <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="2" />
      )}
      {shape === "square" && (
        <rect x="12" y="12" width="40" height="40" stroke={color} strokeWidth="2" />
      )}
    </svg>
  )
}
