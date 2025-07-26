import { useState, useEffect } from 'react';
import { changelog, getLatestVersion } from '../data/Changelog';

const CHANGELOG_STORAGE_KEY = 'dungeonCrawler_lastSeenVersion';

export const useChangelog = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkForNewVersion = () => {
      try {
        const currentVersion = __APP_VERSION__ || '0.1.0';
        const lastSeenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
        
        // Show changelog if:
        // 1. No version has been seen before (first time user)
        // 2. Current version is different from last seen version
        if (!lastSeenVersion || lastSeenVersion !== currentVersion) {
          setShowChangelog(true);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.warn('Error checking changelog version:', error);
        setIsInitialized(true);
      }
    };

    checkForNewVersion();
  }, []);

  const closeChangelog = () => {
    try {
      const currentVersion = __APP_VERSION__ || '0.1.0';
      localStorage.setItem(CHANGELOG_STORAGE_KEY, currentVersion);
      setShowChangelog(false);
    } catch (error) {
      console.warn('Error saving changelog version:', error);
      setShowChangelog(false);
    }
  };

  const forceShowChangelog = () => {
    setShowChangelog(true);
  };

  return {
    showChangelog,
    closeChangelog,
    forceShowChangelog,
    isInitialized,
    changelog,
    latestVersion: __APP_VERSION__ || '0.1.0'
  };
};