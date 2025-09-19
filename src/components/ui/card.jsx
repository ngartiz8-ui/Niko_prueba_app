import React from "react";

export function Card({ children, className = "", style, ...props }) {
  const base = { border: "1px solid #e5e5e5", borderRadius: 12, background: "white" };
  return (
    <div className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", style, ...props }) {
  const base = { padding: "0.75rem 1rem", borderBottom: "1px solid #eee" };
  return (
    <div className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <div className={`font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", style, ...props }) {
  const base = { padding: "0.75rem 1rem" };
  return (
    <div className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </div>
  );
}
