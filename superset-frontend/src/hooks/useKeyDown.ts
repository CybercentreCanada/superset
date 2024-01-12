// CCCS Code, Pulled from here: https://medium.com/@paulohfev/problem-solving-custom-react-hook-for-keydown-events-e68c8b0a371

import { useEffect } from 'react';

export const useKeyDown = (callback: (event: any) => void) => {
  const onKeyDown = (event: any) => {callback(event);};
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};
