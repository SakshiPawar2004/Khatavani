import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { accountsFirebase, entriesFirebase, handleFirebaseError } from '../services/firebaseService';

interface AdminHeaderProps {
  title?: string;
  showStats?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title = "Admin Dashboard", 
  showStats = true 
}) => {
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
    if (showStats) {
      loadStats();
    }
  }, [showStats]);

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

  const balance = stats.totalJama - stats.totalNave;

  return (
    <div className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-gray-300 text-sm">Marathi Ledger Book Management</p>
            </div>
          </div>
          
          {showStats && (
            <div className="flex items-center gap-6">
              {/* Stats Cards - All in one line */}
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-300" />
                  <div className="text-sm">
                    <div className="text-gray-300">Total Accounts</div>
                    <div className="text-lg font-bold text-blue-300">
                      {loading ? '--' : stats.totalAccounts}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-300" />
                  <div className="text-sm">
                    <div className="text-gray-300">Total Entries</div>
                    <div className="text-lg font-bold text-green-300">
                      {loading ? '--' : stats.totalEntries}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-300" />
                  <div className="text-sm">
                    <div className="text-gray-300">Total जमा</div>
                    <div className="text-lg font-bold text-yellow-300">
                      {loading ? '--' : `${stats.totalJama.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-300" />
                  <div className="text-sm">
                    <div className="text-gray-300">Total नावे</div>
                    <div className="text-lg font-bold text-red-300">
                      {loading ? '--' : `${stats.totalNave.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-300" />
                  <div className="text-sm">
                    <div className="text-gray-300">खात्यावर शिल्लक</div>
                    <div className="text-lg font-bold text-red-300">
                      {loading ? '--' : `${balance.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
  );
};

export default AdminHeader;
