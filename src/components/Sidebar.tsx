import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LightBulbIcon,
  ArchiveBoxIcon,
  TrashIcon,
  TagIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, labels } = useStore();

  const navigationItems = [
    { path: '/', icon: LightBulbIcon, label: 'Notes' },
    { path: '/archive', icon: ArchiveBoxIcon, label: 'Archive' },
    { path: '/deleted', icon: TrashIcon, label: 'Deleted' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/notes';
    }
    return location.pathname === path;
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-keep-surface border-r border-keep-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-keep-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-keep-primary rounded-full flex items-center justify-center">
                <span className="text-keep-bg font-bold text-sm">K</span>
              </div>
              <h1 className="text-xl font-medium text-keep-text">Keep</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {/* Main Navigation */}
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-keep-accent text-keep-bg'
                    : 'text-keep-text hover:bg-keep-border'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            {/* Labels Section */}
            <div className="pt-6">
              <h3 className="px-4 py-2 text-sm font-medium text-keep-text-secondary uppercase tracking-wider">
                Labels
              </h3>
              <NavLink
                to="/labels"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/labels'
                    ? 'bg-keep-accent text-keep-bg'
                    : 'text-keep-text hover:bg-keep-border'
                }`}
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Create new label</span>
              </NavLink>

              {/* Dynamic Labels */}
              {labels.map((label) => (
                <NavLink
                  key={label.id}
                  to={`/labels/${encodeURIComponent(label.name)}`}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === `/labels/${encodeURIComponent(label.name)}`
                      ? 'bg-keep-accent text-keep-bg'
                      : 'text-keep-text hover:bg-keep-border'
                  }`}
                >
                  <TagIcon className="w-5 h-5" />
                  <span className="font-medium">{label.name}</span>
                </NavLink>
              ))}
            </div>

            {/* AI Chat */}
            <div className="pt-6 border-t border-keep-border">
              <NavLink
                to="/chat"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname.startsWith('/chat')
                    ? 'bg-keep-accent text-keep-bg'
                    : 'text-keep-text hover:bg-keep-border'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="font-medium">AI Chat</span>
                <span className="ml-auto text-xs bg-keep-primary text-keep-bg px-2 py-1 rounded-full">
                  Beta
                </span>
              </NavLink>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-keep-border">
            <NavLink
              to="/settings"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-keep-accent text-keep-bg'
                  : 'text-keep-text hover:bg-keep-border'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;