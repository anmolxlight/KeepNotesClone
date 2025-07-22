import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArchivePage from './pages/ArchivePage';
import DeletedPage from './pages/DeletedPage';
import LabelsPage from './pages/LabelsPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import NoteEditModal from './components/NoteEditModal';
import { useStore } from './store/useStore';

function App() {
  const currentUser = useStore(state => state.currentUser);

  // For demo purposes, we'll assume user is always logged in
  // In a real app, you'd have authentication logic here
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-keep-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-keep-text mb-4">Keep Notes Clone</h1>
          <p className="text-keep-text-secondary mb-8">Welcome! Loading your notes...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keep-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-keep-bg text-keep-text">
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/notes" element={<Navigate to="/" replace />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/deleted" element={<DeletedPage />} />
            <Route path="/labels" element={<LabelsPage />} />
            <Route path="/labels/:labelName" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:threadId" element={<ChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        
        {/* Note Edit Modal - shown when editing a note */}
        <NoteEditModal />
      </div>
    </Router>
  );
}

export default App;