import React from 'react';
import { X, Star, Wrench, TrendingUp, Scale } from 'lucide-react';
import { ChangelogEntry } from '../data/Changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  changelog: ChangelogEntry[];
  latestVersion: string;
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feature': return <Star className="w-4 h-4 text-green-400" />;
    case 'fix': return <Wrench className="w-4 h-4 text-blue-400" />;
    case 'improvement': return <TrendingUp className="w-4 h-4 text-purple-400" />;
    case 'balance': return <Scale className="w-4 h-4 text-orange-400" />;
    default: return <Star className="w-4 h-4 text-gray-400" />;
  }
};

const getChangeTypeLabel = (type: string) => {
  switch (type) {
    case 'feature': return 'New Feature';
    case 'fix': return 'Bug Fix';
    case 'improvement': return 'Improvement';
    case 'balance': return 'Balance Change';
    default: return 'Change';
  }
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  changelog,
  latestVersion
}) => {
  if (!isOpen) return null;

  const latestEntry = changelog[0];
  const olderEntries = changelog.slice(1);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                🎉 What's New in v{latestVersion}
              </h2>
              <p className="text-slate-300 text-sm">
                {latestEntry?.date}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Latest Version - Featured */}
          {latestEntry && (
            <div className="p-6 border-b border-slate-700">
              <div className="space-y-3">
                {latestEntry.changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    {getChangeIcon(change.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-600/50 text-slate-300">
                          {getChangeTypeLabel(change.type)}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {change.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Versions */}
          {olderEntries.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                📜 Previous Updates
              </h3>
              <div className="space-y-4">
                {olderEntries.map((entry, entryIndex) => (
                  <div key={entry.version} className="border-l-2 border-slate-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-300">
                        v{entry.version}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {entry.date}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entry.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="flex items-start gap-2 text-sm">
                          {getChangeIcon(change.type)}
                          <span className="text-slate-400 leading-relaxed">
                            {change.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-600 p-4 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Thanks for playing Idle Dungeon Crawler!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};