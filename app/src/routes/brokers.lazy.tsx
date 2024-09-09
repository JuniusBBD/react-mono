import BrokerApp from '@mono/brokers/app'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/brokers')({
  component: BrokerApp
})