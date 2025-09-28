// IconNode.tsx
import React from "react"


interface IconNodeProps {
  data: {
    label: string
    Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }
}

export default function IconNode({ data }: IconNodeProps) {
  const { label, Icon } = data

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 4,
        border: "1px solid #888",
        backgroundColor: "#FFF",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Icon && <Icon width={20} height={20} />} 
      {/* If you specifically imported an icon, e.g., Home: <Home size={20} /> */}
      <span style={{ fontSize: "0.9rem" }}>{label}</span>
    </div>
  )
}
