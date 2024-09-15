import { allExpanded, defaultStyles, JsonView } from 'react-json-view-lite';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

export const FeatureFlags = () => {
  const flags = useFeatureFlags();
  return (
    <div className='fixed right-3 bottom-10'>
    <h3 className='underline'>Feature flags</h3>
      <JsonView
        data={flags}
        shouldExpandNode={allExpanded}
        style={defaultStyles}
      />
    </div>
  );
};
