import { useState } from 'react'
import Calendar from './Calendar'
import './App.css'

function App() {
  const [view, setView] = useState('dayGridMonth');

  return (
    <div className="App">
      <div className="controls">
        <button onClick={() => setView('dayGridMonth')}>Month View</button>
        <button onClick={() => setView('timeGridWeek')}>Week View</button>
        <button onClick={() => setView('timeGridDay')}>Day View</button>
      </div>
      <div className="calendar-container">
        <Calendar view={view} />
      </div>
    </div>
  )
}

export default App
