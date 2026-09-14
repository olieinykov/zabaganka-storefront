import { IconProps } from "../../../types/icon"

const Filter: React.FC<IconProps> = ({
  size = "16",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M2 4.5h12M2 8h12M2 11.5h12"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="5.5" cy="4.5" r="1.5" fill={color} stroke="none" />
      <circle cx="10.5" cy="8" r="1.5" fill={color} stroke="none" />
      <circle cx="6.5" cy="11.5" r="1.5" fill={color} stroke="none" />
    </svg>
  )
}

export default Filter