import React from "react";

export function Avatar({ children, className = "", style, ...props }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#f0f0f0",
    overflow: "hidden",
  };
  return (
    <span className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </span>
  );
}

export function AvatarImage({ src, alt = "", className = "", style, ...props }) {
  const base = { width: "100%", height: "100%", objectFit: "cover" };
  return <img src={src} alt={alt} className={className} style={{ ...base, ...style }} {...props} />;
}

export function AvatarFallback({ children, className = "", ...props }) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}
