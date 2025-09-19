import React, { createContext, useContext } from "react";

const TabsCtx = createContext({ value: "", setValue: () => {} });

export function Tabs({ value, onValueChange, children, className = "", ...props }) {
  return (
    <TabsCtx.Provider value={{ value, setValue: onValueChange || (() => {}) }}>
      <div className={className} {...props}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className = "", ...props }) {
  return (
    <div className={`flex gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "", ...props }) {
  const ctx = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`${className}`}
      style={{
        padding: "0.4rem 0.7rem",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: active ? "#111" : "white",
        color: active ? "white" : "black",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "", ...props }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
