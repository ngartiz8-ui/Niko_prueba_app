import React from "react";

export function Button({ children, className = "", style, ...props }) {
  const base = {
    padding: "0.5rem 0.9rem",
    border: "1px solid #d0d0d0",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
  };
  return (
    <button className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </button>
  );
}
