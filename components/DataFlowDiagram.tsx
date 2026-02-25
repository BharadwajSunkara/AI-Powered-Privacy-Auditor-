import React, { useMemo } from 'react';
import { DataFlowGraph, DataFlowNode, DataFlowEdge } from '../types';

interface DataFlowDiagramProps {
  data: DataFlowGraph;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const X_SPACING = 250;
const Y_SPACING = 80;

const TYPE_COLORS: Record<string, string> = {
  user: '#3b82f6', // blue-500
  collection: '#10b981', // emerald-500
  processing: '#f59e0b', // amber-500
  storage: '#6366f1', // indigo-500
  'third-party': '#ef4444', // rose-500
};

const TYPE_LABELS: Record<string, string> = {
  user: 'User / Subject',
  collection: 'Collection Point',
  processing: 'Processing Logic',
  storage: 'Data Storage',
  'third-party': 'Third-Party / External',
};

const DataFlowDiagram: React.FC<DataFlowDiagramProps> = ({ data }) => {
  const layout = useMemo(() => {
    if (!data?.nodes) return [];
    
    const columns: Record<string, DataFlowNode[]> = {
      user: [],
      collection: [],
      processing: [],
      storage: [],
      'third-party': [],
    };

    // Group nodes by type
    data.nodes.forEach(node => {
      const type = node.type.toLowerCase();
      if (columns[type]) {
        columns[type].push(node);
      } else {
        // Fallback for unknown types
        columns['processing'].push(node);
      }
    });

    const nodesWithPos: (DataFlowNode & { x: number; y: number })[] = [];
    const colKeys = ['user', 'collection', 'processing', 'storage', 'third-party'];
    
    // Calculate positions
    colKeys.forEach((key, colIndex) => {
      const colNodes = columns[key];
      const totalHeight = colNodes.length * Y_SPACING;
      const startY = (Math.max(400, totalHeight) - totalHeight) / 2 + 50;

      colNodes.forEach((node, rowIndex) => {
        nodesWithPos.push({
          ...node,
          x: 50 + colIndex * X_SPACING,
          y: startY + rowIndex * Y_SPACING,
        });
      });
    });

    return nodesWithPos;
  }, [data]);

  const getPos = (id: string) => layout.find(n => n.id === id);

  return (
    <div className="w-full overflow-x-auto bg-slate-50 rounded-xl border border-slate-200 p-6 shadow-inner">
      <div className="min-w-[1000px] h-[500px] relative">
        <svg className="w-full h-full">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Edges */}
          {data.edges?.map((edge, idx) => {
            const source = getPos(edge.source);
            const target = getPos(edge.target);
            if (!source || !target) return null;

            const startX = source.x + NODE_WIDTH;
            const startY = source.y + NODE_HEIGHT / 2;
            const endX = target.x;
            const endY = target.y + NODE_HEIGHT / 2;

            const path = `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-500 font-medium bg-white"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layout.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="8"
                fill="white"
                stroke={TYPE_COLORS[node.type] || '#94a3b8'}
                strokeWidth={node.riskLevel === 'high' ? 3 : 1}
                className="filter drop-shadow-sm"
              />
              {/* Header Bar */}
              <rect
                width={NODE_WIDTH}
                height="4"
                x="0"
                y="0"
                rx="2" // Only top corners technically but this is fine for small bar
                fill={TYPE_COLORS[node.type] || '#94a3b8'}
                clipPath="inset(0 0 46 0)" // Clip bottom part
              />
              
              <text
                x={NODE_WIDTH / 2}
                y={20}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-900 uppercase tracking-tight"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
              </text>
              
              <text
                x={NODE_WIDTH / 2}
                y={35}
                textAnchor="middle"
                className="text-[8px] font-medium fill-slate-500 uppercase"
              >
                {TYPE_LABELS[node.type] || node.type}
              </text>

              {node.riskLevel === 'high' && (
                 <circle cx={NODE_WIDTH - 8} cy="8" r="4" fill="#ef4444" />
              )}
            </g>
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 justify-center mt-4 border-t border-slate-200 pt-4">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[key] }}></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataFlowDiagram;
