import SelfOnboardingApp from '@mono/self-onboarding/app'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: SelfOnboardingApp
})