import React from "react";

export function ScrollArea({ children, className = "", style, ...props }) {
  const base = { maxHeight: 360, overflow: "auto" };
  return (
    <div className={className} style={{ ...base, ...style }} {...props}>
      {children}
    </div>
  );
}
