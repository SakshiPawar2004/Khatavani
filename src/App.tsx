import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import TableOfContents from './components/TableOfContents';
import LedgerPage from './components/LedgerPage';
import EntryPage from './components/EntryPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-amber-50">
          <Routes>
            <Route path="/" element={<TableOfContents />} />
            <Route path="/ledger/:id" element={<LedgerPage />} />
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/entry" 
              element={
                <ProtectedRoute>
                  <EntryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/accounts" 
              element={
                <ProtectedRoute>
                  <TableOfContents />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;