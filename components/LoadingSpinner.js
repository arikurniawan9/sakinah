// components/LoadingSpinner.js
import React from 'react';

export default function LoadingSpinner({ message = "Memuat...", size = "normal" }) {
  const sizeClasses = {
    small: "h-4 w-4",
    normal: "h-5 w-5",
    large: "h-8 w-8"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.normal;

  return (
    <div className="flex flex-col items-center justify-center">
      <section className="dots-container">
        <div className={`dot ${sizeClass}`}></div>
        <div className={`dot ${sizeClass}`}></div>
        <div className={`dot ${sizeClass}`}></div>
        <div className={`dot ${sizeClass}`}></div>
        <div className={`dot ${sizeClass}`}></div>
      </section>
      {message && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
