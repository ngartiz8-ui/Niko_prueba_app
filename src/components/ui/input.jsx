import React from "react";

export function Input({ className = "", style, ...props }) {
  const base = {
    width: "100%",
    padding: "0.5rem 0.65rem",
    border: "1px solid #d0d0d0",
    borderRadius: 8,
    background: "white",
  };
  return <input className={className} style={{ ...base, ...style }} {...props} />;
}
