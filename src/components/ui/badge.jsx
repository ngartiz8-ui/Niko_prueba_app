import React from "react";

export function Badge({ children, className = "", style, ...props }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #ddd",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 12,
    background: "#f8f8f8",
  };
  return (
    <span className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </span>
  );
}
