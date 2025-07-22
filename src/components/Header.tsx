import React, { useState } from 'react';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  ViewColumnsIcon,
  ListBulletIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { useLocation, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    setSidebarOpen,
    currentUser
  } = useStore();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/notes':
        return 'Notes';
      case '/archive':
        return 'Archive';
      case '/deleted':
        return 'Deleted';
      case '/labels':
        return 'Labels';
      case '/settings':
        return 'Settings';
      case '/chat':
        return 'AI Chat';
      default:
        if (location.pathname.startsWith('/labels/')) {
          const labelName = location.pathname.split('/').pop();
          return labelName ? `#${labelName}` : 'Labels';
        }
        return 'Notes';
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const getUserInitial = () => {
    return currentUser?.name?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-keep-surface border-b border-keep-border px-4 py-3 flex items-center gap-4">
      {/* Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 hover:bg-keep-border rounded-full transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6 text-keep-text" />
      </button>

      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 bg-keep-primary rounded-full flex items-center justify-center">
            <span className="text-keep-bg font-bold">K</span>
          </div>
          <h1 className="text-xl font-medium text-keep-text">Keep</h1>
        </div>
        <span className="text-keep-text-secondary">•</span>
        <h2 className="text-lg font-medium text-keep-text">{getPageTitle()}</h2>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div 
          className={`relative flex items-center bg-keep-bg rounded-lg border transition-all duration-200 ${
            isSearchFocused 
              ? 'border-keep-primary shadow-lg' 
              : 'border-keep-border hover:border-keep-text-secondary'
          }`}
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-keep-text-secondary ml-4" />
          <input
            type="text"
            placeholder="Search your notes"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="flex-1 bg-transparent px-4 py-3 text-keep-text placeholder-keep-text-secondary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="mr-3 p-1 hover:bg-keep-border rounded-full transition-colors"
              aria-label="Clear search"
            >
              <span className="text-keep-text-secondary">×</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      {(location.pathname === '/' || location.pathname === '/notes' || location.pathname === '/archive') && (
        <div className="hidden md:flex items-center gap-1 bg-keep-bg rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid' 
                ? 'bg-keep-surface text-keep-text' 
                : 'text-keep-text-secondary hover:text-keep-text hover:bg-keep-border'
            }`}
            aria-label="Grid view"
          >
            <ViewColumnsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list' 
                ? 'bg-keep-surface text-keep-text' 
                : 'text-keep-text-secondary hover:text-keep-text hover:bg-keep-border'
            }`}
            aria-label="List view"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Settings Button */}
      <button
        onClick={() => navigate('/settings')}
        className="p-2 hover:bg-keep-border rounded-full transition-colors"
        aria-label="Settings"
      >
        <Cog6ToothIcon className="w-6 h-6 text-keep-text-secondary hover:text-keep-text" />
      </button>

      {/* User Avatar */}
      <div className="w-8 h-8 bg-keep-primary rounded-full flex items-center justify-center">
        <span className="text-keep-bg font-medium text-sm">{getUserInitial()}</span>
      </div>
    </header>
  );
};

export default Header;