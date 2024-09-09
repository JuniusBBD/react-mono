import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/portal')({
  component: () => <div>Hello /portal!</div>
})