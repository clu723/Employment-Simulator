import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import SetupAlias from './components/SetupAlias';
import Simulator from './components/Simulator';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-alias" element={<SetupAlias />} />
          <Route path="/" element={<Simulator />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
