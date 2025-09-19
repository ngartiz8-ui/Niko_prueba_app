import React, { createContext, useContext, useMemo, useState } from "react";

const DialogCtx = createContext({ open: false, setOpen: () => {} });

export function Dialog({ open, onOpenChange, children, className = "", ...props }) {
  const [internal, setInternal] = useState(false);
  const isControlled = typeof open === "boolean";
  const value = useMemo(
    () => ({ open: isControlled ? open : internal, setOpen: (v) => (isControlled ? onOpenChange && onOpenChange(v) : setInternal(v)) }),
    [isControlled, open, internal, onOpenChange]
  );
  return (
    <DialogCtx.Provider value={value}>
      <div className={className} {...props}>{children}</div>
    </DialogCtx.Provider>
  );
}

export function DialogTrigger({ asChild, children }) {
  const { setOpen } = useContext(DialogCtx);
  const Child = asChild ? React.Children.only(children) : <button>{children}</button>;
  return React.cloneElement(Child, { onClick: () => setOpen(true) });
}

export function DialogContent({ children, className = "", style, ...props }) {
  const { open, setOpen } = useContext(DialogCtx);
  if (!open) return null;
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
    display: "grid", placeItems: "center", zIndex: 50
  };
  const panel = {
    background: "white", borderRadius: 12, minWidth: 320, maxWidth: 640,
    width: "90vw", padding: "1rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  };
  return (
    <div style={overlay} onClick={() => setOpen(false)}>
      <div className={className} style={{ ...panel, ...style }} {...props} onClick={(e)=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className = "", ...props }) {
  return <div className={className} {...props}>{children}</div>;
}
export function DialogTitle({ children, className = "", ...props }) {
  return <h2 className={className} {...props}>{children}</h2>;
}
