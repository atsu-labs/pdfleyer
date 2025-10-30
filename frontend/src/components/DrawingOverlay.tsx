import React, { useRef, useEffect, useState } from 'react';

export type ToolType = 'rect' | 'circle' | 'line' | 'freehand' | 'text' | null;

export interface Annotation {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'path' | 'text';
  page: number;
  bbox: { x: number; y: number; w: number; h: number };
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface DrawingOverlayProps {
  width: number;
  height: number;
  page?: number;
  onAnnotationCreate?: (annotation: Annotation) => void;
  showToolbar?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface CanvasRenderParams {
  width: number;
  height: number;
  selectedTool: ToolType;
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  pathPoints: Point[];
}

// Helper function to create annotation from drawing
function createAnnotation(
  tool: ToolType,
  start: Point,
  end: Point,
  points: Point[],
  page: number
): Annotation | null {
  if (!tool) return null;
  
  const timestamp = Date.now();
  const baseAttrs = { color: '#000000', strokeWidth: 2 };
  
  if (tool === 'rect' || tool === 'circle') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    
    return {
      id: `ann-${timestamp}`,
      type: tool,
      page,
      bbox: { x, y, w, h },
      attributes: baseAttrs,
      createdAt: new Date().toISOString(),
    };
  }
  
  if (tool === 'line') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    
    return {
      id: `ann-${timestamp}`,
      type: 'line',
      page,
      bbox: { x, y, w, h },
      attributes: {
        ...baseAttrs,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
      },
      createdAt: new Date().toISOString(),
    };
  }
  
  if (tool === 'freehand' && points.length > 0) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const w = Math.max(...xs) - x;
    const h = Math.max(...ys) - y;
    
    return {
      id: `ann-${timestamp}`,
      type: 'path',
      page,
      bbox: { x, y, w, h },
      attributes: {
        ...baseAttrs,
        points,
      },
      createdAt: new Date().toISOString(),
    };
  }
  
  return null;
}

// Helper function to render canvas preview
function renderCanvas(ctx: CanvasRenderingContext2D, params: CanvasRenderParams): void {
  const { width, height, selectedTool, isDrawing, startPoint, currentPoint, pathPoints } = params;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw preview while dragging
  if (isDrawing && startPoint && currentPoint) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    if (selectedTool === 'rect') {
      const w = currentPoint.x - startPoint.x;
      const h = currentPoint.y - startPoint.y;
      ctx.strokeRect(startPoint.x, startPoint.y, w, h);
    } else if (selectedTool === 'circle') {
      const centerX = (startPoint.x + currentPoint.x) / 2;
      const centerY = (startPoint.y + currentPoint.y) / 2;
      const radiusX = Math.abs(currentPoint.x - startPoint.x) / 2;
      const radiusY = Math.abs(currentPoint.y - startPoint.y) / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (selectedTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
  }

  // Draw freehand path preview
  if (selectedTool === 'freehand' && pathPoints.length > 1) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.stroke();
  }
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  width,
  height,
  page = 1,
  onAnnotationCreate,
  showToolbar = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  // Render preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCanvas(ctx, {
      width,
      height,
      selectedTool,
      isDrawing,
      startPoint,
      currentPoint,
      pathPoints,
    });
  }, [isDrawing, startPoint, currentPoint, selectedTool, pathPoints, width, height]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || selectedTool === 'text') return;
    
    const point = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
    
    if (selectedTool === 'freehand') {
      setPathPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !selectedTool) return;
    
    const point = getCanvasCoordinates(e);
    setCurrentPoint(point);
    
    if (selectedTool === 'freehand') {
      setPathPoints(prev => [...prev, point]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    
    const point = getCanvasCoordinates(e);
    const annotation = createAnnotation(selectedTool, startPoint, point, pathPoints, page);
    
    if (annotation) {
      onAnnotationCreate?.(annotation);
    }
    
    if (selectedTool === 'freehand') {
      setPathPoints([]);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text' && !showTextInput) {
      const point = getCanvasCoordinates(e);
      setTextPosition(point);
      setShowTextInput(true);
      setTextValue('');
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textValue.trim() && textPosition) {
      const annotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'text',
        page,
        bbox: { x: textPosition.x, y: textPosition.y, w: 100, h: 20 },
        attributes: {
          text: textValue,
          fontSize: 16,
          color: '#000000',
        },
        createdAt: new Date().toISOString(),
      };
      
      onAnnotationCreate?.(annotation);
      setShowTextInput(false);
      setTextValue('');
      setTextPosition(null);
    } else if (e.key === 'Escape') {
      setShowTextInput(false);
      setTextValue('');
      setTextPosition(null);
    }
  };

  const handleToolSelect = (tool: ToolType) => {
    setSelectedTool(tool);
  };

  const renderToolButton = (tool: ToolType, label: string) => (
    <button
      data-testid={`tool-${tool}`}
      aria-pressed={selectedTool === tool}
      onClick={() => handleToolSelect(tool)}
      style={{
        padding: '8px 16px',
        marginRight: 5,
        backgroundColor: selectedTool === tool ? '#007acc' : '#f0f0f0',
        color: selectedTool === tool ? 'white' : 'black',
        border: '1px solid #ccc',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Toolbar (only if showToolbar is true) */}
      {showToolbar && (
        <div style={{ 
          marginBottom: 10,
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: 4,
          display: 'inline-block'
        }}>
          {renderToolButton('rect', 'Rectangle')}
          {renderToolButton('circle', 'Circle')}
          {renderToolButton('line', 'Line')}
          {renderToolButton('freehand', 'Freehand')}
          {renderToolButton('text', 'Text')}
        </div>
      )}
      
      {/* Drawing Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          data-testid="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          style={{
            cursor: selectedTool ? 'crosshair' : 'default',
            display: 'block',
          }}
        />
        
        {showTextInput && textPosition && (
          <input
            data-testid="text-input"
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            autoFocus
            style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y,
              padding: 5,
              border: '2px solid #007acc',
              outline: 'none',
              fontSize: 16,
              zIndex: 1000,
            }}
          />
        )}
      </div>
    </>
  );
};

export default DrawingOverlay;
