// CCCS Code, Pulled from here: https://medium.com/@paulohfev/problem-solving-custom-react-hook-for-keydown-events-e68c8b0a371

import { useEffect } from 'react';

export const useKeyDown = (callback: (event: KeyboardEvent) => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      callback(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
};
