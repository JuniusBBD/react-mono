import DeviceActivationApp from '@mono/device-activation/app'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/device-activation')({
  component: DeviceActivationApp
})