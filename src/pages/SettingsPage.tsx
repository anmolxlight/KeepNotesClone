import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { exportNotesToJSON, importNotesFromJSON } from '../utils/helpers';

const SettingsPage: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    notes, 
    setNotes, 
    viewMode, 
    setViewMode,
    labels
  } = useStore();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'data' | 'danger'>('profile');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');

  const handleSaveProfile = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: userName,
        email: userEmail,
      });
    }
  };

  const handleExportNotes = () => {
    const notesJson = exportNotesToJSON(notes);
    const blob = new Blob([notesJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keep-notes-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = importNotesFromJSON(e.target?.result as string);
          setNotes([...notes, ...importedNotes]);
          alert(`Successfully imported ${importedNotes.length} notes!`);
        } catch (error) {
          alert('Failed to import notes. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL notes and data? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete everything. Are you absolutely sure?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
    { id: 'data', label: 'Data Management', icon: DocumentArrowDownIcon },
    { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-keep-text mb-2">Settings</h2>
          <p className="text-keep-text-secondary">
            Manage your account, preferences, and application settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-keep-primary text-white'
                      : 'text-keep-text hover:bg-keep-border'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-keep-surface rounded-lg border border-keep-border p-6">
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div>
                  <h3 className="text-lg font-medium text-keep-text mb-6">Profile Information</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-keep-primary rounded-full flex items-center justify-center">
                        <span className="text-keep-bg font-bold text-xl">
                          {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-keep-text font-medium">{currentUser?.name}</h4>
                        <p className="text-keep-text-secondary">{currentUser?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-keep-text mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 bg-keep-bg border border-keep-border rounded-lg text-keep-text focus:outline-none focus:border-keep-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-keep-text mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-keep-bg border border-keep-border rounded-lg text-keep-text focus:outline-none focus:border-keep-primary"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-keep-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div>
                  <h3 className="text-lg font-medium text-keep-text mb-6">Application Preferences</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-keep-text mb-3">
                        Default View Mode
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            viewMode === 'grid'
                              ? 'border-keep-primary bg-keep-primary text-white'
                              : 'border-keep-border text-keep-text hover:bg-keep-border'
                          }`}
                        >
                          Grid View
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            viewMode === 'list'
                              ? 'border-keep-primary bg-keep-primary text-white'
                              : 'border-keep-border text-keep-text hover:bg-keep-border'
                          }`}
                        >
                          List View
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-keep-border">
                      <h4 className="text-keep-text font-medium mb-3">Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-keep-bg rounded-lg">
                          <div className="text-2xl font-bold text-keep-primary">{notes.length}</div>
                          <div className="text-sm text-keep-text-secondary">Total Notes</div>
                        </div>
                        <div className="text-center p-4 bg-keep-bg rounded-lg">
                          <div className="text-2xl font-bold text-keep-primary">
                            {notes.filter(n => !n.isDeleted && !n.isArchived).length}
                          </div>
                          <div className="text-sm text-keep-text-secondary">Active</div>
                        </div>
                        <div className="text-center p-4 bg-keep-bg rounded-lg">
                          <div className="text-2xl font-bold text-keep-primary">
                            {notes.filter(n => n.isArchived).length}
                          </div>
                          <div className="text-sm text-keep-text-secondary">Archived</div>
                        </div>
                        <div className="text-center p-4 bg-keep-bg rounded-lg">
                          <div className="text-2xl font-bold text-keep-primary">{labels.length}</div>
                          <div className="text-sm text-keep-text-secondary">Labels</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Management Section */}
              {activeSection === 'data' && (
                <div>
                  <h3 className="text-lg font-medium text-keep-text mb-6">Data Management</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-keep-text font-medium mb-3">Export Notes</h4>
                      <p className="text-keep-text-secondary text-sm mb-4">
                        Download all your notes as a JSON file for backup or migration.
                      </p>
                      <button
                        onClick={handleExportNotes}
                        className="flex items-center gap-2 px-4 py-2 bg-keep-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Export All Notes
                      </button>
                    </div>

                    <div className="pt-6 border-t border-keep-border">
                      <h4 className="text-keep-text font-medium mb-3">Import Notes</h4>
                      <p className="text-keep-text-secondary text-sm mb-4">
                        Import notes from a previously exported JSON file.
                      </p>
                      <label className="flex items-center gap-2 px-4 py-2 bg-keep-surface border border-keep-border text-keep-text rounded-lg hover:bg-keep-border transition-colors cursor-pointer">
                        <DocumentArrowUpIcon className="w-4 h-4" />
                        Import Notes
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportNotes}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {activeSection === 'danger' && (
                <div>
                  <h3 className="text-lg font-medium text-red-600 mb-6">Danger Zone</h3>
                  
                  <div className="border border-red-300 rounded-lg p-6 bg-red-50">
                    <h4 className="text-red-800 font-medium mb-3">Clear All Data</h4>
                    <p className="text-red-700 text-sm mb-4">
                      This will permanently delete all your notes, labels, and settings. 
                      This action cannot be undone. Make sure to export your data first.
                    </p>
                    <button
                      onClick={handleClearAllData}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Clear All Data
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;