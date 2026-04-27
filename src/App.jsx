import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TutorialProvider } from './context/TutorialContext';
import TutorialOverlay from './components/TutorialOverlay';
import Login from './components/Login';
import SetupAlias from './components/SetupAlias';
import Simulator from './components/Simulator';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TutorialProvider>
          <TutorialOverlay />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup-alias" element={<PrivateRoute><SetupAlias /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><Simulator /></PrivateRoute>} />
          </Routes>
        </TutorialProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
