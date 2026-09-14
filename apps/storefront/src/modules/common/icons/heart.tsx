import { IconProps } from "../../../types/icon"

type HeartProps = IconProps & { filled?: boolean }

const Heart: React.FC<HeartProps> = ({
  size = "20",
  color = "currentColor",
  filled = false,
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M10 17.25s-6.5-3.98-8.5-7.9C.24 6.6 1.6 3.75 4.4 3.2c1.62-.32 3.3.4 4.2 1.83a.44.44 0 0 0 .8 0c.9-1.43 2.58-2.15 4.2-1.83 2.8.55 4.16 3.4 2.9 6.15-2 3.92-8.5 7.9-8.5 7.9Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </svg>
  )
}

export default Heart
