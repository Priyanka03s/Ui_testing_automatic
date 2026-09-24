import React, { useState } from 'react';
import { Eye, Layers, Sliders, AlertTriangle } from 'lucide-react';
import { Badge } from '../common/Badge';

export const DiffViewer = ({
  pageResult,
  onSelectBug,
  selectedBugId,
}) => {
  const [viewMode, setViewMode] = useState('implementation'); // 'reference', 'implementation', 'difference', 'overlay'
  const [opacity, setOpacity] = useState(50);

  if (!pageResult) {
    return (
      <div className="h-96 glass-panel rounded-2xl flex items-center justify-center text-gray-500">
        No page result selected
      </div>
    );
  }

  const {
    figmaReferenceUrl,
    actualScreenshotUrl,
    diffScreenshotUrl,
    matchPercentage,
    differenceRegions = [],
    pageName,
    websiteRoute,
  } = pageResult;

  return (
    <div className="space-y-4">
      {/* View Mode Toolbar */}
      <div className="glass-panel p-3 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('implementation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'implementation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Implementation
          </button>
          <button
            onClick={() => setViewMode('reference')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'reference'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Figma Reference
          </button>
          <button
            onClick={() => setViewMode('difference')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'difference'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Diff Highlight
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'overlay'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Overlay Slider
          </button>
        </div>

        {viewMode === 'overlay' && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Figma</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
              className="w-32 accent-blue-500 cursor-pointer"
            />
            <span>Website ({opacity}%)</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Match Similarity:</span>
          <span
            className={`text-sm font-black px-2 py-0.5 rounded ${
              matchPercentage >= 95
                ? 'bg-emerald-500/20 text-emerald-400'
                : matchPercentage >= 80
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {matchPercentage}%
          </span>
          <Badge variant={pageResult.status}>{pageResult.status}</Badge>
        </div>
      </div>

      {/* Main Canvas Comparison Area */}
      <div className="relative glass-panel rounded-2xl p-4 overflow-hidden border border-gray-800 flex justify-center bg-gray-950/80 min-h-[500px]">
        {/* MODE: Reference Only */}
        {viewMode === 'reference' && (
          <div className="relative max-w-full overflow-auto rounded-lg shadow-2xl">
            <img
              src={figmaReferenceUrl}
              alt="Figma Reference"
              className="w-full object-contain max-h-[700px] rounded-lg"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-2.5 py-1 rounded text-[11px] font-semibold text-gray-300 border border-gray-700">
              Figma Design Reference
            </div>
          </div>
        )}

        {/* MODE: Difference Heatmap Only */}
        {viewMode === 'difference' && (
          <div className="relative max-w-full overflow-auto rounded-lg shadow-2xl">
            <img
              src={diffScreenshotUrl}
              alt="Visual Diff Map"
              className="w-full object-contain max-h-[700px] rounded-lg"
            />
            <div className="absolute top-3 left-3 bg-red-950/80 backdrop-blur px-2.5 py-1 rounded text-[11px] font-semibold text-red-300 border border-red-800">
              Pixel Difference Heatmap
            </div>
          </div>
        )}

        {/* MODE: Interactive Overlay */}
        {viewMode === 'overlay' && (
          <div className="relative max-w-full overflow-auto rounded-lg shadow-2xl">
            <img
              src={figmaReferenceUrl}
              alt="Figma Reference"
              className="w-full object-contain max-h-[700px] rounded-lg block"
            />
            <img
              src={actualScreenshotUrl}
              alt="Live Implementation"
              className="absolute inset-0 w-full h-full object-contain rounded-lg"
              style={{ opacity: opacity / 100 }}
            />
          </div>
        )}

        {/* MODE: Implementation Screenshot with Bounding Boxes */}
        {viewMode === 'implementation' && (
          <div className="relative max-w-full overflow-auto rounded-lg shadow-2xl inline-block">
            <img
              src={actualScreenshotUrl}
              alt="Live Implementation Screenshot"
              className="w-full object-contain max-h-[700px] rounded-lg block"
            />

            {/* Interactive Difference Region Bounding Boxes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1440 900"
              preserveAspectRatio="xMidYMid meet"
            >
              {differenceRegions.map((region, idx) => {
                const isSelected = selectedBugId === idx;
                return (
                  <g
                    key={idx}
                    className="pointer-events-auto cursor-pointer group"
                    onClick={() => onSelectBug && onSelectBug(region, idx)}
                  >
                    <rect
                      x={region.x}
                      y={region.y}
                      width={region.width}
                      height={region.height}
                      fill="rgba(239, 68, 68, 0.15)"
                      stroke={isSelected ? '#3b82f6' : '#ef4444'}
                      strokeWidth={isSelected ? '4' : '2'}
                      strokeDasharray={isSelected ? 'none' : '4 2'}
                      rx="4"
                      className="transition-all duration-150 group-hover:fill-red-500/30 group-hover:stroke-width-3"
                    />
                    {/* Floating coordinate / badge pill */}
                    <g transform={`translate(${region.x}, ${Math.max(20, region.y - 8)})`}>
                      <rect
                        width="80"
                        height="20"
                        rx="4"
                        fill="#ef4444"
                        className="shadow-md"
                      />
                      <text
                        x="40"
                        y="14"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="system-ui, sans-serif"
                      >
                        BUG #{idx + 1}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-2.5 py-1 rounded text-[11px] font-semibold text-gray-300 border border-gray-700">
              Live Implementation ({differenceRegions.length} Detected Differences)
            </div>
          </div>
        )}
      </div>

      {differenceRegions.length > 0 && viewMode === 'implementation' && (
        <div className="text-center text-xs text-gray-400">
          <span className="text-red-400 font-semibold">Tip:</span> Click any highlighted red bounding box on the screenshot to view the exact bug analysis and AI investigation advice.
        </div>
      )}
    </div>
  );
};
