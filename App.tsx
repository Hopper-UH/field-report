import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ReportForm from './components/ReportForm';
import ReportView from './components/ReportView';
import { Report, ReportType } from './types';
import { Plus, ChevronDown, FileText, Search, Menu, Save, Pencil } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'create', 'view', 'edit', 'settings'
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [createType, setCreateType] = useState<ReportType>(ReportType.FIELD_INSPECTION);
  
  // Settings State
  const [settings, setSettings] = useState({ name: '', email: '', phone: '' });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-download trigger for ReportView
  const [autoDownload, setAutoDownload] = useState(false);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    // Load reports
    const saved = localStorage.getItem('field_reports_v2'); 
    if (saved) {
      setReports(JSON.parse(saved));
    } else {
      // Seed some dummy data
      const dummy: Report[] = [
        {
          id: 'RPT-2025-001',
          type: ReportType.FIELD_INSPECTION,
          date: '2025-04-21',
          timeRange: '10:30AM to 1:30PM',
          projectName: 'SPLOST II Pedestrian sidewalk improvement Project',
          jobId: 'N/A',
          ownerDeveloper: 'City Of Clarkston',
          projectAddress: 'Brockett Rd',
          stageOfConstruction: 'Demolition',
          projectType: 'Pedestrian sidewalk improvement Project',
          inspectionType: 'Field Inspection',
          weather: 'Windy / 63 F',
          photosTaken: true,
          visualInspectionIssue: 'N/A',
          inspectorName: 'Tirth Patel',
          inspectorPhone: '832-848-5569',
          inspectorEmail: 'patel@co-infra-services.com',
          signature: '', 
          generalComments: 'The inspector confirmed that the Construction 57 (Contractor) crew has started sidewalk demolition near 4 Sisters Asian Grocery.\n\nThe inspector confirmed that Construction 57 (Contractor) installed temporary traffic control signs on Brockett Road as required.\n\nThe inspector confirmed that the Construction 57 (Contractor) crew cleaned the construction site following the completion of their work.',
          images: [],
          status: 'Completed',
          createdAt: Date.now()
        }
      ];
      setReports(dummy);
      localStorage.setItem('field_reports_v2', JSON.stringify(dummy));
    }

    // Load settings - we don't set state here anymore if we want fields to remain empty by default
    // or we set them if we want to show current values. 
    // The user requested empty fields after save, but usually we want to see them on load.
    // I will load them so the user knows what is there, but clear them on SAVE as requested.
    const savedSettings = localStorage.getItem('field_reporter_settings');
    if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSaveReport = (report: Report, shouldDownload: boolean = false) => {
    // Remove existing if editing, add new to top
    const filtered = reports.filter(r => r.id !== report.id);
    const updated = [report, ...filtered];
    
    setReports(updated);
    localStorage.setItem('field_reports_v2', JSON.stringify(updated));
    
    // Set view state
    setSelectedReport(report);
    setAutoDownload(shouldDownload);
    setCurrentView('view');
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        const updated = reports.filter(r => r.id !== id);
        setReports(updated);
        localStorage.setItem('field_reports_v2', JSON.stringify(updated));
        setCurrentView('dashboard');
        setSelectedReport(null);
    }
  };

  const handleEditReport = (report: Report) => {
      setSelectedReport(report);
      setCreateType(report.type);
      setCurrentView('edit');
  };

  const handleCreateClick = (type: ReportType) => {
    setCreateType(type);
    setCurrentView('create');
    setIsDropdownOpen(false);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setAutoDownload(false);
    setCurrentView('view');
  };

  const saveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('field_reporter_settings', JSON.stringify(settings));
      alert('Settings saved! Future reports will use these details.');
      // User requested to clear fields after saving
      setSettings({ name: '', email: '', phone: '' }); 
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Filter reports based on search
  const filteredReports = reports.filter(r => 
    r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.projectAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dashboard Stats
  const totalReports = reports.length;
  const recentReports = filteredReports.slice(0, 5);

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      {/* Changed margin logic: only apply left margin on Large screens (lg). Tablets now behave like mobile. */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">
        
        {/* Mobile/Tablet Header */}
        {/* Changed visibility: visible up to lg breakpoint */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden sticky top-0 z-10">
           <div className="flex items-center">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
               <Menu className="w-6 h-6" />
             </button>
             <h1 className="font-bold text-lg text-slate-800">Field Reporter</h1>
           </div>
        </div>

        <div className="p-4 md:p-8">
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-500 mt-1">Construction Field Reporting System</p>
                </div>
                
                {/* "New Report" Dropdown Button */}
                <div className="relative w-full md:w-auto">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Report
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full md:w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        {Object.values(ReportType).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleCreateClick(type)}
                            className="block w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b last:border-0"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Left Column: Stats & Summary */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats Cards - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Reports</div>
                      <div className="text-3xl font-bold text-slate-900">{totalReports}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                       <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Projects</div>
                      <div className="text-3xl font-bold text-slate-900">{new Set(reports.map(r => r.projectName)).size}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">This Month</div>
                      <div className="text-3xl font-bold text-slate-900">
                        {reports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length}
                      </div>
                    </div>
                  </div>

                  {/* Main Content Placeholder or Chart Area */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-xl md:text-2xl font-bold mb-2">Field Inspection Overview</h2>
                      <p className="text-slate-300 max-w-lg text-sm md:text-base">
                        Manage field inspections, track site progress, and generate PDF reports. 
                        Click "New Report" to start a Field Inspection Report.
                      </p>
                    </div>
                    <FileText className="absolute -bottom-6 -right-6 w-48 h-48 md:w-64 md:h-64 text-slate-700 opacity-20" />
                  </div>
                </div>

                {/* Right Side: History / Recent Forms */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Recent Forms</h3>
                      </div>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 max-h-[400px] lg:max-h-none">
                      {recentReports.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                           {searchQuery ? 'No matching reports.' : 'No reports found.'}
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {recentReports.map(report => (
                            <li key={report.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                              <div onClick={() => handleViewReport(report)} className="flex-1 min-w-0">
                                <div className="font-medium text-slate-800 text-sm truncate">{report.projectName}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{formatDate(report.date)}</div>
                              </div>
                              
                              <div className="hidden group-hover:flex items-center space-x-1">
                                 {/* Edit Button */}
                                 <button
                                   onClick={(e) => { e.stopPropagation(); handleEditReport(report); }}
                                   className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                   title="Edit Report"
                                 >
                                   <Pencil className="w-4 h-4" />
                                 </button>
                                 {/* View Button */}
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleViewReport(report); }}
                                   className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                   title="View Report"
                                 >
                                   <FileText className="w-4 h-4" />
                                 </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                     <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-center">
                       <button onClick={() => setCurrentView('reports')} className="text-sm font-medium text-blue-600 hover:text-blue-700">View All History</button>
                     </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: ALL REPORTS LIST */}
          {currentView === 'reports' && (
               <div className="max-w-6xl mx-auto">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 hover:text-slate-800 mr-4">Back</button>
                        <h1 className="text-2xl font-bold text-slate-900">All Reports</h1>
                      </div>
                      
                      {/* Search Bar in All Reports */}
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                              <tr>
                                  <th className="p-4 font-semibold">Date</th>
                                  <th className="p-4 font-semibold">Project</th>
                                  <th className="p-4 font-semibold">Inspector</th>
                                  <th className="p-4 font-semibold text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                              {filteredReports.map(r => (
                                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4">{formatDate(r.date)}</td>
                                      <td className="p-4 font-medium text-slate-900">{r.projectName}</td>
                                      <td className="p-4">{r.inspectorName}</td>
                                      <td className="p-4 text-right flex justify-end space-x-2">
                                          <button onClick={() => handleEditReport(r)} className="text-slate-600 hover:text-blue-600 font-medium px-3 py-1 flex items-center">
                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                          </button>
                                          <button onClick={() => handleViewReport(r)} className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1">View</button>
                                          <button onClick={() => handleDeleteReport(r.id)} className="text-red-600 hover:text-red-800 font-medium px-3 py-1">Delete</button>
                                      </td>
                                  </tr>
                              ))}
                              {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        No reports found matching "{searchQuery}"
                                    </td>
                                </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
               </div>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center">
                    <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 hover:text-slate-800 mr-4">Back</button>
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Inspector Profile</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Save your default details here. These will automatically appear in new reports.
                        </p>
                    </div>
                    
                    <form onSubmit={saveSettings} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                className="w-full rounded border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. John Doe"
                                value={settings.name}
                                onChange={(e) => setSettings({...settings, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                className="w-full rounded border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 555-0123"
                                value={settings.phone}
                                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full rounded border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. john@example.com"
                                value={settings.email}
                                onChange={(e) => setSettings({...settings, email: e.target.value})}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                             <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors flex items-center"
                             >
                                <Save className="w-4 h-4 mr-2" />
                                Save Settings
                             </button>
                        </div>
                    </form>
                </div>
              </div>
          )}

          {/* VIEW: CREATE FORM (used for NEW and EDIT) */}
          {(currentView === 'create' || currentView === 'edit') && (
            <ReportForm
              selectedType={createType}
              onSave={(r, d) => handleSaveReport(r, d)}
              onCancel={() => setCurrentView('dashboard')}
              initialData={currentView === 'edit' ? selectedReport! : undefined}
              history={reports}
            />
          )}

          {/* VIEW: REPORT DETAILS */}
          {currentView === 'view' && selectedReport && (
            <ReportView
              report={selectedReport}
              onBack={() => setCurrentView('dashboard')}
              onDelete={() => handleDeleteReport(selectedReport.id)}
              autoDownload={autoDownload}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default App;
