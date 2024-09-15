import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { FeatureFlagsProvider } from './context/featureFlagContext'
import { FeatureFlags } from './components/FeatureFlags'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const featureFlagsEndpoint = 'https://g56o50x0il.execute-api.eu-central-1.amazonaws.com/prod/feature-flags';

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <FeatureFlagsProvider endpoint={featureFlagsEndpoint}>
        <RouterProvider router={router} />
        <FeatureFlags />
      </FeatureFlagsProvider>
    </StrictMode>,
  )
}
