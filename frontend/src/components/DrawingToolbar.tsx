import React from 'react';

export type ToolType = 'rect' | 'circle' | 'line' | 'freehand' | 'text' | null;

export interface DrawingToolbarProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  const renderToolButton = (tool: ToolType, label: string) => (
    <button
      data-testid={`tool-${tool}`}
      aria-pressed={selectedTool === tool}
      onClick={() => onToolSelect(tool)}
      style={{
        padding: '8px 16px',
        marginRight: 5,
        backgroundColor: selectedTool === tool ? '#007acc' : '#f0f0f0',
        color: selectedTool === tool ? 'white' : 'black',
        border: '1px solid #ccc',
        cursor: 'pointer',
        borderRadius: 4,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ 
      marginBottom: 10,
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: 4,
      display: 'inline-block'
    }}>
      {renderToolButton(null, '選択 (Select)')}
      {renderToolButton('rect', '矩形')}
      {renderToolButton('circle', '円')}
      {renderToolButton('line', '直線')}
      {renderToolButton('freehand', 'フリーハンド')}
      {renderToolButton('text', 'テキスト')}
    </div>
  );
};

export default DrawingToolbar;
