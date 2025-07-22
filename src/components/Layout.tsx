import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import FloatingActionButtons from './FloatingActionButtons';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const sidebarOpen = useStore(state => state.sidebarOpen);

  return (
    <div className="flex h-screen bg-keep-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Floating Action Buttons */}
      <FloatingActionButtons />
      
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => useStore.getState().setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;