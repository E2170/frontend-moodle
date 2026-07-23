import React from "react";

export default function LoadingSpinner({ size = "md", color = "blue", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4"
  };
  
  const colorClasses = {
    blue: "border-gray-200 border-t-[#0056b3]",
    white: "border-white border-t-transparent",
    gray: "border-gray-200 border-t-[#495057]"
  };

  const sz = sizeClasses[size] || sizeClasses.md;
  const col = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${sz} ${col} rounded-full animate-spin ${className}`} />
  );
}
