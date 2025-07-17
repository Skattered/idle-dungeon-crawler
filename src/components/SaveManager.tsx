import React, { useState } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { isProd } from '../utils/Environment';

interface SaveManagerProps {
  onExportSave: () => string;
  onImportSave: (data: string) => boolean;
  onManualSave: () => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({
  onExportSave,
  onImportSave,
  onManualSave
}) => {
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [exportData, setExportData] = useState('');
  const [showExport, setShowExport] = useState(false);

  const handleExport = () => {
    const data = onExportSave();
    setExportData(data);
    setShowExport(true);
  };

  const getSaveSize = (data: string): string => {
    const bytes = new Blob([data]).size;
    if (bytes < 1024) return `${bytes} bytes`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleImport = () => {
    if (!importData.trim()) return;
    
    const success = onImportSave(importData.trim());
    if (success) {
      setImportData('');
      setShowImport(false);
    } else {
      alert('Failed to import save data. Please check the format.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      alert('Save data copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-center">Save Management</h3>
      
      {isProd() && (
        <div className="mb-3 text-center">
          <span className="text-green-400 text-sm">🔄 Autosave enabled (every 30s)</span>
        </div>
      )}
      
      <div className="space-y-2">
        {/* Manual Save */}
        <button
          onClick={onManualSave}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
        >
          <Save size={16} />
          Manual Save
        </button>

        {/* Export Save */}
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
        >
          <Download size={16} />
          Export Save
        </button>

        {/* Import Save */}
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded transition-colors"
        >
          <Upload size={16} />
          Import Save
        </button>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full mx-4">
            <h4 className="text-lg font-semibold mb-3">Export Save Data</h4>
            <p className="text-sm text-gray-300 mb-3">
              Save data ({getSaveSize(exportData)}). Copy and store safely to restore progress later.
            </p>
            <textarea
              value={exportData}
              readOnly
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-sm font-mono resize-none"
              onClick={(e) => e.currentTarget.select()}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full mx-4">
            <h4 className="text-lg font-semibold mb-3">Import Save Data</h4>
            <p className="text-sm text-gray-300 mb-3">
              Paste your save data below. This will overwrite your current progress.
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your save data here..."
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-sm font-mono resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportData('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};