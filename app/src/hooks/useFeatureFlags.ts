import React from 'react';
import { FeatureFlagsContext } from '../context/featureFlagContext';

export const useFeatureFlags = () => {
  const context = React.useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};