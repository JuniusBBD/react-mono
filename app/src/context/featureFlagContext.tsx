import React from 'react';

type FeatureFlags = {
  newFeature: boolean;
}

type Props = {
  children: React.ReactNode;
  endpoint: string;
}


// Create the context with default values
export const FeatureFlagsContext = React.createContext<FeatureFlags | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<Props> = ({ endpoint, children }) => {
  const [flags, setFlags] = React.useState<FeatureFlags>({ newFeature: false });

  React.useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        setFlags(data);
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      }
    };

    fetchFeatureFlags();
  }, [endpoint]);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};