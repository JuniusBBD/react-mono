import BrokerApp from '@mono/brokers/app'
import DeviceActivationApp from '@mono/device-activation/app'
import SelfOnboardingApp from '@mono/self-onboarding/app'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelfOnboardingApp />} />
        <Route path="/brokers" element={<BrokerApp />} />
        <Route path="/device-activation" element={<DeviceActivationApp />} />
      </Routes>
    </Router>
  )
}

export default App
