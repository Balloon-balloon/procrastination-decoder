"use client";
import { useEffect, useState } from "react";

export function DarkModeManager() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsDark(hour >= 22 || hour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDark]);

  return (
    <>
      {isDark && (
        <svg className="constellation-overlay" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stars-pattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="80" r="1.5" fill="white" opacity="0.8" className="star-twinkle" />
              <circle cx="120" cy="40" r="1" fill="white" opacity="0.6" />
              <circle cx="200" cy="100" r="2" fill="white" opacity="0.9" className="star-twinkle" />
              <circle cx="280" cy="60" r="1" fill="white" opacity="0.5" />
              <circle cx="80" cy="180" r="1.5" fill="white" opacity="0.7" />
              <circle cx="160" cy="220" r="1" fill="white" opacity="0.6" className="star-twinkle" />
              <circle cx="240" cy="160" r="1.5" fill="white" opacity="0.8" />
              <circle cx="40" cy="260" r="1" fill="white" opacity="0.5" />
              <circle cx="180" cy="280" r="1.5" fill="white" opacity="0.7" className="star-twinkle" />
              <line x1="50" y1="80" x2="120" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <line x1="120" y1="40" x2="200" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="200" y1="100" x2="280" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="80" y1="180" x2="160" y2="220" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="160" y1="220" x2="240" y2="160" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="240" y1="160" x2="180" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stars-pattern)" />
        </svg>
      )}
    </>
  );
}
