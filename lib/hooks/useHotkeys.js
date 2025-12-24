// lib/hooks/useHotkeys.js
import { useEffect } from 'react';

export const useHotkeys = (hotkeys, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      for (const { keys, callback } of hotkeys) {
        const requiredKeys = keys.split('+').map(k => k.trim().toLowerCase());
        
        const altPressed = requiredKeys.includes('alt') ? event.altKey : !event.altKey;
        const ctrlPressed = requiredKeys.includes('ctrl') ? event.ctrlKey : !event.ctrlKey;
        const shiftPressed = requiredKeys.includes('shift') ? event.shiftKey : !event.shiftKey;
        
        const mainKey = requiredKeys.find(k => k !== 'alt' && k !== 'ctrl' && k !== 'shift');

        if (altPressed && ctrlPressed && shiftPressed && event.key.toLowerCase() === mainKey) {
          event.preventDefault();
          callback();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hotkeys, ...deps]);
};
