import React from "react"

import { IconProps } from "types/icon"

const Bag: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
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
        d="M5.5 7.5V6a4.5 4.5 0 0 1 9 0v1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.2 7.5h11.6l.7 9.1a1.5 1.5 0 0 1-1.5 1.62H5a1.5 1.5 0 0 1-1.5-1.62l.7-9.1Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Bag
