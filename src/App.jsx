import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Login from './components/Login';
import SetupAlias from './components/SetupAlias';
import MainLayout from './components/layout/MainLayout';

const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/setup-alias" element={<PrivateRoute><SetupAlias /></PrivateRoute>} />
                    <Route path="/" element={
                        <PrivateRoute>
                            <GameProvider>
                                <MainLayout />
                            </GameProvider>
                        </PrivateRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
