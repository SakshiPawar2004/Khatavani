import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, Plus, Settings, BarChart3 } from 'lucide-react';
import TableOfContents from './TableOfContents';
import { accountsFirebase, entriesFirebase, Account, Entry, handleFirebaseError } from '../services/firebaseService';

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalEntries: 0,
    totalJama: 0,
    totalNave: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const accounts = await accountsFirebase.getAll();
      
      // Load all entries
      const entries = await entriesFirebase.getAll();
      
      // Calculate totals
      const jamaEntries = entries.filter(entry => entry.type === 'जमा');
      const naveEntries = entries.filter(entry => entry.type === 'नावे');
      
      const totalJama = jamaEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalNave = naveEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      setStats({
        totalAccounts: accounts.length,
        totalEntries: entries.length,
        totalJama,
        totalNave
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Admin Header */}
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-300 text-sm">Marathi Ledger Book Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Accounts</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '--' : stats.totalAccounts}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Entries</h3>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '--' : stats.totalEntries}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total जमा</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? '₹--' : `₹${stats.totalJama.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total नावे</h3>
                <p className="text-2xl font-bold text-red-600">
                  {loading ? '₹--' : `₹${stats.totalNave.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/entry')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Entry
            </button>
            <button
              onClick={() => navigate('/admin/accounts')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Manage Accounts
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View User Interface
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Table of Contents with Admin Features */}
      <TableOfContents />
    </div>
  );
};

export default AdminDashboard;