import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CheckCircle2, EyeOff, AlertCircle, Sparkles, MapPin, Layers } from 'lucide-react';

export const BugModal = ({ bug, isOpen, onClose, onUpdateStatus, isUpdating }) => {
  if (!bug) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={bug.title || 'Visual QA Discrepancy'}>
      <div className="space-y-5 text-left">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bug.severity}>{bug.severity}</Badge>
          <Badge variant={bug.status}>{bug.status}</Badge>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-medium">
            Category: {bug.category}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {Math.round((bug.confidence || 0.85) * 100)}% Confidence
          </span>
        </div>

        {/* Observed Fact Description */}
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Observed Discrepancy</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{bug.description}</p>
        </div>

        {/* AI Suggested Investigation */}
        {bug.suggestedFix && (
          <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-500/20 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Suggested Investigation / Fix</span>
            </div>
            <p className="text-sm text-blue-200/90 leading-relaxed">{bug.suggestedFix}</p>
          </div>
        )}

        {/* Coordinate details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-800/80 text-xs">
          <div>
            <span className="text-gray-500 block">Coordinate X</span>
            <span className="font-mono text-gray-200 font-semibold">{bug.x}px</span>
          </div>
          <div>
            <span className="text-gray-500 block">Coordinate Y</span>
            <span className="font-mono text-gray-200 font-semibold">{bug.y}px</span>
          </div>
          <div>
            <span className="text-gray-500 block">Width</span>
            <span className="font-mono text-gray-200 font-semibold">{bug.width}px</span>
          </div>
          <div>
            <span className="text-gray-500 block">Height</span>
            <span className="font-mono text-gray-200 font-semibold">{bug.height}px</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-800 gap-3">
          <div className="flex items-center gap-2">
            {bug.status !== 'resolved' ? (
              <Button
                variant="success"
                size="sm"
                isLoading={isUpdating}
                onClick={() => onUpdateStatus(bug._id, 'resolved')}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                isLoading={isUpdating}
                onClick={() => onUpdateStatus(bug._id, 'open')}
              >
                <span>Reopen Bug</span>
              </Button>
            )}

            {bug.status !== 'ignored' && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={isUpdating}
                onClick={() => onUpdateStatus(bug._id, 'ignored')}
              >
                <EyeOff className="w-4 h-4" />
                <span>Ignore Bug</span>
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
