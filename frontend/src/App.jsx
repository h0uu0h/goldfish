import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Fish from './components/Fish'
import Octopus from './components/Octopus'
import SpikyBall from './components/SpikyBall'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SpikyBall />

    </>
  )
}

export default App
