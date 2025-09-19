import React from "react";
export function Separator({ className = "", style, ...props }) {
  return <hr className={className} style={{ border: 0, borderTop: "1px solid #eee", ...style }} {...props} />;
}
