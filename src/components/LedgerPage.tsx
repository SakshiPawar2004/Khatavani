import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, FileText, Printer, Edit3, Trash2, Download, Wifi, WifiOff, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { accountsFirebase, entriesFirebase, Account, Entry, handleFirebaseError } from '../services/firebaseService';
import AdminHeader from './AdminHeader';
import { formatDate, formatDateForFilename } from '../utils/dateUtils';

// Helper to highlight account name at start of details
const highlightAccountName = (details: string, accounts: { [key: string]: string }) => {
  if (!details) return details;
  // Find if details starts with any account name
  const found = Object.values(accounts).find(name => details.startsWith(name));
  if (found) {
    // Remove any colons or spaces after the account name
    let rest = details.slice(found.length).replace(/^[:\s]+/, '');
    // Add a single colon
    return <span><span style={{color:'#dc2626', fontWeight:'bold'}}>{found}:</span>{rest ? ' ' + rest : ''}</span>;
  }
  return details;
};

// Helper to remove account name from details in LedgerPage
const stripAccountName = (details: string, accounts: { [key: string]: string }) => {
  if (!details) return details;
  // Find if details starts with any account name
  const found = Object.values(accounts).find(name => details.startsWith(name));
  if (found) {
    // Remove the account name and any colons/spaces after it
    let rest = details.slice(found.length).replace(/^[:\s]+/, '');
    return rest;
  }
  return details;
};

const LedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    accountNumber: '',
    receiptNumber: '',
    details: '',
    amount: ''
  });
  const { isAdmin, logout } = useAuth();
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load entries and accounts from Firebase
  useEffect(() => {
    loadData();
  }, [id]);

  // Reload data when coming back to this page (to get updated account names)
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    
    // Listen for account name updates
    const handleAccountUpdate = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('accountNameUpdated', handleAccountUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('accountNameUpdated', handleAccountUpdate);
    };
  }, []);
  const loadData = async () => {
    if (!id) return;
    
    try {
      setError(null);
      
      // Load accounts
      const accountsData = await accountsFirebase.getAll();
      const accountMap: { [key: string]: string } = {};
      accountsData.forEach((acc) => {
        accountMap[acc.khateNumber] = acc.name;
      });
      setAccounts(accountMap);
      
      // Load entries for this account
      const entriesData = await entriesFirebase.getByAccount(id);
      setEntries(entriesData);
    } catch (err) {
      setError(handleFirebaseError(err));
      console.error('Error loading data:', err);
    }
  };

  // Filter entries for this account
  const accountEntries = entries;
  const jamaEntries = accountEntries.filter(entry => entry.type === 'जमा');
  const naveEntries = accountEntries.filter(entry => entry.type === 'नावे');
  
  // Calculate totals
  const jamaTotal = jamaEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const naveTotal = naveEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const balance = jamaTotal - naveTotal;

  // Sort entries by date only
  const sortedEntries = [...accountEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const accountName = accounts[id || ''] || `खाते नंबर ${id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setEditFormData({
      date: entry.date,
      accountNumber: entry.accountNumber,
      receiptNumber: entry.receiptNumber || '',
      details: entry.details,
      amount: entry.amount.toString()
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-fill details when account number changes
    if (name === 'accountNumber') {
      const accountName = accounts[value];
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        details: accountName ? `${accountName}\n` : ''
      }));
    } else if (name === 'amount') {
      // Handle amount formatting on blur
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditAmountBlur = (value: string) => {
    if (value && !isNaN(parseFloat(value))) {
      const formattedAmount = parseFloat(value).toFixed(2);
      setEditFormData(prev => ({ ...prev, amount: formattedAmount }));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('इंटरनेट कनेक्शन नाही! कृपया ऑनलाइन येऊन पुन्हा प्रयत्न करा.');
      return;
    }
    
    if (editingEntry && editFormData.date && editFormData.accountNumber && editFormData.details && editFormData.amount) {
      try {
        await entriesFirebase.update(editingEntry.id!, {
          date: editFormData.date,
          accountNumber: editFormData.accountNumber,
          receiptNumber: editFormData.receiptNumber || '',
          details: editFormData.details,
          amount: parseFloat(editFormData.amount)
        });
        
        setEditingEntry(null);
        setEditFormData({
          date: '',
          accountNumber: '',
          receiptNumber: '',
          details: '',
          amount: ''
        });
        
        loadData(); // Reload entries
      } catch (err) {
        alert('नोंद संपादित करताना त्रुटी: ' + handleFirebaseError(err));
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditFormData({
      date: '',
      accountNumber: '',
      receiptNumber: '',
      details: '',
      amount: ''
    });
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!isOnline) {
      alert('इंटरनेट कनेक्शन नाही! कृपया ऑनलाइन येऊन पुन्हा प्रयत्न करा.');
      return;
    }
    
    if (confirm('क्या आपण या नोंदी काढून टाकाल? या क्रिया आता पुन्हा पुन्हा करण्यास अवघड असेल.')) {
      try {
        await entriesFirebase.delete(entryId);
        loadData(); // Reload entries
      } catch (err) {
        alert('नोंद हटवताना त्रुटी: ' + handleFirebaseError(err));
      }
    }
  };

  const handleExportToExcel = () => {
    if (accountEntries.length === 0) {
      alert('या खात्यासाठी निर्यात करण्यासाठी कोणत्याही नोंदी उपलब्ध नाहीत!');
      return;
    }

    // Prepare data for Excel - export exactly as shown in the ledger table
    const excelData = sortedEntries.map((entry: Entry) => ({
      'तारीख': formatDate(entry.date),
      'पावती नं.': entry.receiptNumber || '-',
      'तपशील': stripAccountName(entry.details, accounts),
      'जमा रक्कम': entry.type === 'जमा' ? entry.amount.toFixed(2) : '-',
      'नावे रक्कम': entry.type === 'नावे' ? entry.amount.toFixed(2) : '-'
    }));

    // Add total row
    excelData.push({
      'तारीख': '',
      'पावती नं.': '',
      'तपशील': 'एकूण:',
      'जमा रक्कम': jamaTotal.toFixed(2),
      'नावे रक्कम': naveTotal.toFixed(2)
    });

    // Add balance row
    excelData.push({
      'तारीख': '',
      'पावती नं.': '',
      'तपशील': 'शिल्लक:',
      'जमा रक्कम': '',
      'नावे रक्कम': `${Math.abs(balance).toFixed(2)}`
    });


    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `खाते_${id}_${accountName}`);

    // Generate Excel file and download
    XLSX.writeFile(wb, `खाते_${id}_${accountName}_${formatDateForFilename(new Date())}.xlsx`);
  };

  // Format amount to show .00
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 marathi-font mb-4">त्रुटी: {error}</p>
          <button
            onClick={loadData}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
          >
            पुन्हा प्रयत्न करा
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Admin Header */}
      {isAdmin && <AdminHeader title={`खाते ${accountName}`} showStats={true} />}
      
      {/* Combined Header with School Building Background */}
      <div className="combined-header shadow-lg print:shadow-none">
        {/* School Header Section */}
        <div className="school-header-section marathi-font">
          टी झेड पवार माध्यमिक विद्यालय गोराणे  ता. बागलाण जि. नाशिक
        </div>
        
        {/* Main Header Section */}
        <div className="main-header-section print:hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 bg-black bg-opacity-30 hover:bg-opacity-40 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="english-font">खतावणी बघा</span>
              </Link>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <h1 className="text-xl md:text-2xl font-bold marathi-font">{accountName}</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm english-font">
                  <div>Account No: {id}</div>
                  <div>Balance: {formatAmount(Math.abs(balance))}</div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-1">
                    <button
                      onClick={handlePrint}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      Print
                    </button>
                    <button
                      onClick={handleExportToExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Excel
                    </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-center marathi-font print:hidden">
          <strong>इंटरनेट कनेक्शन नाही!</strong> तुम्ही फक्त डेटा पाहू शकता. संपादन करण्यासाठी इंटरनेट कनेक्शन आवश्यक आहे.
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 print:px-2 print:py-2">
        {/* Print-only Account Name Header */}
        <div className="hidden print:block text-center mb-4">
          <h2 className="text-lg font-bold marathi-font">{accountName}</h2>
        </div>
        
        {/* Edit Entry Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-blue-800 marathi-font">
                    नोंद संपादित करा - {editingEntry.type}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className={`p-6 ${
                editingEntry.type === 'जमा' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 marathi-font ${
                      editingEntry.type === 'जमा' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      तारीख *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditInputChange}
                      required
                      disabled={!isOnline}
                      className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                        editingEntry.type === 'जमा' 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      } ${!isOnline ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 marathi-font ${
                      editingEntry.type === 'जमा' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      खाते नंबर *
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={editFormData.accountNumber}
                      onChange={handleEditInputChange}
                      required
                      disabled={!isOnline}
                      placeholder="खाते नंबर"
                      className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-opacity-50 marathi-font ${
                        editingEntry.type === 'जमा' 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      } ${!isOnline ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 marathi-font ${
                      editingEntry.type === 'जमा' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      पावती नंबर
                    </label>
                    <input
                      type="text"
                      name="receiptNumber"
                      value={editFormData.receiptNumber}
                      onChange={handleEditInputChange}
                      disabled={!isOnline}
                      placeholder="पावती नंबर"
                      className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-opacity-50 marathi-font ${
                        editingEntry.type === 'जमा' 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      } ${!isOnline ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 marathi-font ${
                      editingEntry.type === 'जमा' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      रक्कम *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={editFormData.amount}
                      onChange={handleEditInputChange}
                      onBlur={(e) => handleEditAmountBlur(e.target.value)}
                      required
                      disabled={!isOnline}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-opacity-50 english-font ${
                        editingEntry.type === 'जमा' 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      } ${!isOnline ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 marathi-font ${
                    editingEntry.type === 'जमा' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    तपशील *
                  </label>
                  <textarea
                    name="details"
                    value={editFormData.details}
                    onChange={handleEditInputChange}
                    required
                    disabled={!isOnline}
                    placeholder="तपशील लिहा..."
                    rows={4}
                    className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-opacity-50 marathi-font resize-vertical ${
                      editingEntry.type === 'जमा' 
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                        : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    } ${!isOnline ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium english-font transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isOnline}
                    className={`px-6 py-3 rounded-lg font-medium english-font transition-colors flex items-center gap-2 ${
                      isOnline 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Simplified Ledger Table - Like Second Photo */}
        {accountEntries.length > 0 ? (
          <div className="bg-white rounded-lg page-shadow ledger-border overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm print:text-base border border-black print-table-fixed">
                <thead>
                  <tr className="bg-amber-600 text-white print:bg-gray-100 print:text-black">
                    <th className="p-2 text-center marathi-font border border-black align-middle print-date-col">तारीख</th>
                    <th className="p-2 text-center marathi-font border border-black align-middle print-account-col">खाते नं.</th>
                    <th className="p-2 text-center marathi-font border border-black align-middle print-details-col">तपशील</th>
                    <th className="p-2 text-center marathi-font border border-black align-middle print-amount-col">जमा रक्कम</th>
                    <th className="p-2 text-center marathi-font border border-black align-middle print-amount-col">नावे रक्कम</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry, index) => {
                    return (
                      <tr key={entry.id} className="hover:bg-amber-50 transition-colors border-b print:hover:bg-transparent print:bg-white">
                        <td className="p-2 english-font border border-black text-center align-middle print-date-col print:text-xs">
                          {formatDate(entry.date)}
                        </td>
                        <td className="p-2 marathi-font border border-black text-center align-middle print-account-col print:text-xs">
                          {entry.accountNumber}
                        </td>
                        <td className="p-2 marathi-font leading-relaxed border border-black text-wrap print-details-col print-break-words print:text-xs">
                          {stripAccountName(entry.details, accounts)}
                          {entry.id && isAdmin && (
                            <button
                              onClick={() => handleDeleteEntry(entry.id!)}
                              disabled={!isOnline}
                              className={`delete-btn ml-2 p-1 rounded text-xs print:hidden ${
                                isOnline 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="p-2 text-right font-medium english-font border border-black print-amount-col print:text-xs">
                          {entry.type === 'जमा' ? `${formatAmount(entry.amount)}` : '-'}
                        </td>
                        <td className="p-2 text-right font-medium english-font border border-black print-amount-col print:text-xs">
                          {entry.type === 'नावे' ? `${formatAmount(entry.amount)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total Row */}
                  <tr className="bg-blue-100 font-bold print:bg-gray-100">
                    <td colSpan={3} className="p-2 text-right marathi-font border border-black print:text-xs">
                      एकूण:
                    </td>
                    <td className="p-2 text-right english-font border border-black print-amount-col print:text-xs">
                      {formatAmount(jamaTotal)}
                    </td>
                    <td className="p-2 text-right english-font border border-black print-amount-col print:text-xs">
                      {formatAmount(naveTotal)}
                    </td>
                  </tr>
                  
                  {/* Balance Row */}
                  <tr className="bg-green-100 font-bold print:bg-gray-200">
                    <td colSpan={4} className="p-2 text-right marathi-font border border-black print:text-xs">
                      शिल्लक:
                    </td>
                    <td className="p-2 text-right english-font border border-black print-amount-col print:text-xs">
                      {formatAmount(Math.abs(balance))}
                    </td>
                  </tr>
                  
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg page-shadow ledger-border p-8 text-center text-gray-500 marathi-font print:shadow-none print:border-0 print:rounded-none">
            या खात्यासाठी कोणत्याही नोंदी उपलब्ध नाहीत
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-center print:hidden">
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium english-font transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to खतावणी अनुक्रमणिका
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;