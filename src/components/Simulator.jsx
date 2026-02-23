import React, { useState, useEffect } from 'react';
import ClockIn from './ClockIn';
import Workspace from './Workspace';
import Summary from './Summary';

export default function Simulator() {
    const [gameState, setGameState] = useState('CLOCK_IN'); // CLOCK_IN, WORK, SUMMARY
    const [sessionData, setSessionData] = useState(null);
    const [results, setResults] = useState(null);

    const handleClockIn = (data) => {
        setSessionData(data);
        setGameState('WORK');
        // Push state to history to enable catching the back button
        window.history.pushState({ isSimulatorActive: true }, '');
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

    // Prevent accidental back navigation during an active session
    useEffect(() => {
        const handlePopState = (e) => {
            if (gameState === 'WORK') {
                const confirmLeave = window.confirm("Are you sure you want to leave? Your current session will be lost.");
                if (confirmLeave) {
                    // User confirmed, revert to clock in
                    setGameState('CLOCK_IN');
                    setSessionData(null);
                } else {
                    // User canceled, push the state back to keep them on the page
                    window.history.pushState({ isSimulatorActive: true }, '');
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [gameState]);

    return (
        <div className="bg-black min-h-screen font-sans">
            {gameState === 'CLOCK_IN' && <ClockIn onClockIn={handleClockIn} />}
            {gameState === 'WORK' && <Workspace sessionData={sessionData} onEndSession={handleEndSession} />}
            {gameState === 'SUMMARY' && <Summary results={results} onRestart={handleRestart} />}
        </div>
    );
}
