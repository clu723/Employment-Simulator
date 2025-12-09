import React, { useState } from 'react';
import ClockIn from './components/ClockIn';
import Workspace from './components/Workspace';
import Summary from './components/Summary';

function App() {
  const [gameState, setGameState] = useState('CLOCK_IN'); // CLOCK_IN, WORK, SUMMARY
  const [sessionData, setSessionData] = useState(null);
  const [results, setResults] = useState(null);

  const handleClockIn = (data) => {
    setSessionData(data);
    setGameState('WORK');
  };

  const handleEndSession = (resultData) => {
    setResults(resultData);
    setGameState('SUMMARY');
  };

  const handleRestart = () => {
    setSessionData(null);
    setResults(null);
    setGameState('CLOCK_IN');
  };

  return (
    <div className="bg-black min-h-screen font-sans">
      {gameState === 'CLOCK_IN' && <ClockIn onClockIn={handleClockIn} />}
      {gameState === 'WORK' && <Workspace sessionData={sessionData} onEndSession={handleEndSession} />}
      {gameState === 'SUMMARY' && <Summary results={results} onRestart={handleRestart} />}
    </div>
  );
}

export default App;
