import React from 'react'
import { createRoot } from 'react-dom/client'
import ConfidentialTradingDashboard from '../confidential-trading-zama.jsx'

function App(){
  return <ConfidentialTradingDashboard />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
