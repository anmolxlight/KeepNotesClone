import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import { generateId } from '../utils/helpers';

const LabelsPage: React.FC = () => {
  const { labels, addLabel, updateLabel, deleteLabel } = useStore();
  const [newLabelName, setNewLabelName] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      addLabel({
        id: generateId(),
        name: newLabelName.trim(),
      });
      setNewLabelName('');
    }
  };

  const handleStartEdit = (labelId: string, currentName: string) => {
    setEditingLabel(labelId);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingLabel && editingName.trim()) {
      updateLabel(editingLabel, { name: editingName.trim() });
    }
    setEditingLabel(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setEditingName('');
  };

  const handleDeleteLabel = (labelId: string, labelName: string) => {
    if (window.confirm(`Delete label "${labelName}"? This will remove it from all notes.`)) {
      deleteLabel(labelId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'create' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'create') {
        handleCreateLabel();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape' && action === 'edit') {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-keep-text mb-2">Manage Labels</h2>
          <p className="text-keep-text-secondary">
            Create and organize labels to categorize your notes effectively.
          </p>
        </div>

        {/* Create New Label */}
        <div className="bg-keep-surface rounded-lg border border-keep-border p-6 mb-6">
          <h3 className="text-lg font-medium text-keep-text mb-4">Create New Label</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'create')}
              className="flex-1 px-4 py-2 bg-keep-bg border border-keep-border rounded-lg text-keep-text placeholder-keep-text-secondary focus:outline-none focus:border-keep-primary"
            />
            <button
              onClick={handleCreateLabel}
              disabled={!newLabelName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-keep-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>

        {/* Labels List */}
        <div className="bg-keep-surface rounded-lg border border-keep-border overflow-hidden">
          <div className="p-4 border-b border-keep-border">
            <h3 className="text-lg font-medium text-keep-text">Your Labels</h3>
            <p className="text-keep-text-secondary text-sm mt-1">
              {labels.length} {labels.length === 1 ? 'label' : 'labels'}
            </p>
          </div>

          {labels.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mx-auto mb-4">
                <TagIcon className="w-8 h-8 text-keep-text-secondary" />
              </div>
              <h4 className="text-lg font-medium text-keep-text mb-2">No labels yet</h4>
              <p className="text-keep-text-secondary">
                Create your first label above to start organizing your notes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-keep-border">
              {labels.map((label) => (
                <div key={label.id} className="p-4 flex items-center justify-between group hover:bg-keep-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-keep-border rounded-full flex items-center justify-center">
                      <TagIcon className="w-4 h-4 text-keep-text-secondary" />
                    </div>
                    
                    {editingLabel === label.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'edit')}
                        onBlur={handleSaveEdit}
                        className="px-2 py-1 bg-keep-bg border border-keep-border rounded text-keep-text focus:outline-none focus:border-keep-primary"
                        autoFocus
                      />
                    ) : (
                      <span className="text-keep-text font-medium">{label.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingLabel === label.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(label.id, label.name)}
                          className="p-1 text-keep-text-secondary hover:text-keep-text hover:bg-keep-border rounded transition-colors"
                          title="Edit label"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLabel(label.id, label.name)}
                          className="p-1 text-keep-text-secondary hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete label"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-blue-900 font-medium mb-2">💡 Tips</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use labels to categorize notes by topic, project, or priority</li>
            <li>• You can assign multiple labels to a single note</li>
            <li>• Click on a label in the sidebar to view all notes with that label</li>
            <li>• Labels are automatically suggested when typing # in notes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LabelsPage;