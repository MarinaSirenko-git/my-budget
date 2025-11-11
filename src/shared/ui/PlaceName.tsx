import { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const DEFAULT_PLACE_NAME = 'Phuket';

export default function PlaceName() {
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);

  useEffect(() => {
    // Load saved place name from localStorage
    const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
    if (savedPlaceName) {
      setPlaceName(savedPlaceName);
    }
  }, []);

  // Listen for storage changes to update when changed from Settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PLACE_NAME_STORAGE_KEY && e.newValue) {
        setPlaceName(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCustomStorageChange = () => {
      const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
      if (savedPlaceName) {
        setPlaceName(savedPlaceName);
      }
    };

    window.addEventListener('placeNameChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('placeNameChanged', handleCustomStorageChange);
    };
  }, []);

  return (
    <h1 className="text-md text-mainTextColor dark:text-white flex items-center gap-1">
      <MapPinIcon className="w-5 h-5" />
      {placeName}
    </h1>
  );
}

