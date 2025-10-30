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

export interface DrawingCanvasProps {
  width: number;
  height: number;
  selectedTool: ToolType;
  page?: number;
  onAnnotationCreate?: (annotation: Annotation) => void;
}

interface Point {
  x: number;
  y: number;
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
  const baseAttrs = { color: '#FF0000', strokeWidth: 3 };
  
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
function renderCanvas(ctx: CanvasRenderingContext2D, params: {
  width: number;
  height: number;
  selectedTool: ToolType;
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  pathPoints: Point[];
  storedAnnotations: Annotation[];
  selectedAnnotationId: string | null;
}): void {
  const { width, height, selectedTool, isDrawing, startPoint, currentPoint, pathPoints, storedAnnotations, selectedAnnotationId } = params;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw stored annotations
  storedAnnotations.forEach(ann => {
    const isSelected = ann.id === selectedAnnotationId;
    ctx.strokeStyle = ann.attributes.color || '#FF0000';
    ctx.lineWidth = ann.attributes.strokeWidth || 3;
    ctx.fillStyle = 'transparent';

    if (ann.type === 'rect') {
      ctx.strokeRect(ann.bbox.x, ann.bbox.y, ann.bbox.w, ann.bbox.h);
      
      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(ann.bbox.x - 2, ann.bbox.y - 2, ann.bbox.w + 4, ann.bbox.h + 4);
        ctx.setLineDash([]);
        drawResizeHandles(ctx, ann.bbox);
      }
    } else if (ann.type === 'circle') {
      const centerX = ann.bbox.x + ann.bbox.w / 2;
      const centerY = ann.bbox.y + ann.bbox.h / 2;
      const radiusX = ann.bbox.w / 2;
      const radiusY = ann.bbox.h / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(ann.bbox.x - 2, ann.bbox.y - 2, ann.bbox.w + 4, ann.bbox.h + 4);
        ctx.setLineDash([]);
        drawResizeHandles(ctx, ann.bbox);
      }
    } else if (ann.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(ann.attributes.startX, ann.attributes.startY);
      ctx.lineTo(ann.attributes.endX, ann.attributes.endY);
      ctx.stroke();
      
      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(ann.bbox.x - 2, ann.bbox.y - 2, ann.bbox.w + 4, ann.bbox.h + 4);
        ctx.setLineDash([]);
        drawResizeHandles(ctx, ann.bbox);
      }
    } else if (ann.type === 'path' && ann.attributes.points?.length > 1) {
      const pts = ann.attributes.points;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      
      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(ann.bbox.x - 2, ann.bbox.y - 2, ann.bbox.w + 4, ann.bbox.h + 4);
        ctx.setLineDash([]);
        drawResizeHandles(ctx, ann.bbox);
      }
    } else if (ann.type === 'text') {
      ctx.font = `${ann.attributes.fontSize || 16}px Arial`;
      ctx.fillStyle = ann.attributes.color || '#FF0000';
      ctx.fillText(ann.attributes.text || '', ann.bbox.x, ann.bbox.y + (ann.attributes.fontSize || 16));
      
      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(ann.bbox.x - 2, ann.bbox.y - 2, ann.bbox.w + 4, ann.bbox.h + 4);
        ctx.setLineDash([]);
        drawResizeHandles(ctx, ann.bbox);
      }
    }
  });

  // Draw preview while dragging
  if (isDrawing && startPoint && currentPoint) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;

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
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.stroke();
  }
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

// Helper function to check if point is inside bbox
function isPointInBbox(point: Point, bbox: { x: number; y: number; w: number; h: number }): boolean {
  return point.x >= bbox.x && point.x <= bbox.x + bbox.w &&
         point.y >= bbox.y && point.y <= bbox.y + bbox.h;
}

// Helper function to get resize handle at point
function getResizeHandleAtPoint(point: Point, bbox: { x: number; y: number; w: number; h: number }): ResizeHandle {
  const handleSize = 8;
  const handles = {
    nw: { x: bbox.x, y: bbox.y },
    ne: { x: bbox.x + bbox.w, y: bbox.y },
    sw: { x: bbox.x, y: bbox.y + bbox.h },
    se: { x: bbox.x + bbox.w, y: bbox.y + bbox.h },
    n: { x: bbox.x + bbox.w / 2, y: bbox.y },
    s: { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h },
    e: { x: bbox.x + bbox.w, y: bbox.y + bbox.h / 2 },
    w: { x: bbox.x, y: bbox.y + bbox.h / 2 },
  };

  for (const [key, handle] of Object.entries(handles)) {
    if (Math.abs(point.x - handle.x) <= handleSize && Math.abs(point.y - handle.y) <= handleSize) {
      return key as ResizeHandle;
    }
  }
  return null;
}

// Helper function to draw resize handles
function drawResizeHandles(ctx: CanvasRenderingContext2D, bbox: { x: number; y: number; w: number; h: number }): void {
  const handleSize = 6;
  const handles = [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.w, y: bbox.y },
    { x: bbox.x, y: bbox.y + bbox.h },
    { x: bbox.x + bbox.w, y: bbox.y + bbox.h },
    { x: bbox.x + bbox.w / 2, y: bbox.y },
    { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h },
    { x: bbox.x + bbox.w, y: bbox.y + bbox.h / 2 },
    { x: bbox.x, y: bbox.y + bbox.h / 2 },
  ];

  ctx.fillStyle = '#007acc';
  handles.forEach(handle => {
    ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
  });
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height,
  selectedTool,
  page = 1,
  onAnnotationCreate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState('');
  const [storedAnnotations, setStoredAnnotations] = useState<Annotation[]>([]);
  
  // Selection state
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [moveStartPoint, setMoveStartPoint] = useState<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  // Render canvas
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
      storedAnnotations,
      selectedAnnotationId,
    });
  }, [isDrawing, startPoint, currentPoint, selectedTool, pathPoints, width, height, storedAnnotations, selectedAnnotationId]);

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
    const point = getCanvasCoordinates(e);
    
    // Selection mode (no tool selected)
    if (!selectedTool) {
      // Check if clicking on a resize handle of selected annotation
      if (selectedAnnotationId) {
        const selectedAnn = storedAnnotations.find(ann => ann.id === selectedAnnotationId);
        if (selectedAnn) {
          const handle = getResizeHandleAtPoint(point, selectedAnn.bbox);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setStartPoint(point);
            return;
          }
          
          // Check if clicking inside selected annotation for moving
          if (isPointInBbox(point, selectedAnn.bbox)) {
            setIsMoving(true);
            setMoveStartPoint(point);
            return;
          }
        }
      }
      
      // Check if clicking on any annotation to select it
      for (let i = storedAnnotations.length - 1; i >= 0; i--) {
        if (isPointInBbox(point, storedAnnotations[i].bbox)) {
          setSelectedAnnotationId(storedAnnotations[i].id);
          return;
        }
      }
      
      // Click on empty area - deselect
      setSelectedAnnotationId(null);
      return;
    }
    
    // Drawing mode
    if (selectedTool === 'text') return;
    
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
    
    if (selectedTool === 'freehand') {
      setPathPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    
    // Handle moving
    if (isMoving && selectedAnnotationId && moveStartPoint) {
      const dx = point.x - moveStartPoint.x;
      const dy = point.y - moveStartPoint.y;
      
      setStoredAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId) {
          return {
            ...ann,
            bbox: {
              ...ann.bbox,
              x: ann.bbox.x + dx,
              y: ann.bbox.y + dy,
            },
            attributes: ann.type === 'line' ? {
              ...ann.attributes,
              startX: ann.attributes.startX + dx,
              startY: ann.attributes.startY + dy,
              endX: ann.attributes.endX + dx,
              endY: ann.attributes.endY + dy,
            } : ann.type === 'path' ? {
              ...ann.attributes,
              points: ann.attributes.points.map((p: Point) => ({ x: p.x + dx, y: p.y + dy })),
            } : ann.attributes,
          };
        }
        return ann;
      }));
      
      setMoveStartPoint(point);
      return;
    }
    
    // Handle resizing
    if (isResizing && selectedAnnotationId && startPoint && resizeHandle) {
      const dx = point.x - startPoint.x;
      const dy = point.y - startPoint.y;
      
      setStoredAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId) {
          const oldBbox = ann.bbox;
          let newBbox = { ...oldBbox };
          
          if (resizeHandle.includes('e')) {
            newBbox.w += dx;
          }
          if (resizeHandle.includes('w')) {
            newBbox.x += dx;
            newBbox.w -= dx;
          }
          if (resizeHandle.includes('s')) {
            newBbox.h += dy;
          }
          if (resizeHandle.includes('n')) {
            newBbox.y += dy;
            newBbox.h -= dy;
          }
          
          // Ensure minimum size to prevent negative dimensions
          const minSize = 5;
          if (newBbox.w < minSize) {
            newBbox.w = minSize;
          }
          if (newBbox.h < minSize) {
            newBbox.h = minSize;
          }
          
          // Update type-specific attributes based on bbox changes
          let newAttributes = { ...ann.attributes };
          
          if (ann.type === 'line') {
            // Recalculate line endpoints based on new bbox
            const scaleX = newBbox.w / oldBbox.w;
            const scaleY = newBbox.h / oldBbox.h;
            
            newAttributes = {
              ...newAttributes,
              startX: (ann.attributes.startX - oldBbox.x) * scaleX + newBbox.x,
              startY: (ann.attributes.startY - oldBbox.y) * scaleY + newBbox.y,
              endX: (ann.attributes.endX - oldBbox.x) * scaleX + newBbox.x,
              endY: (ann.attributes.endY - oldBbox.y) * scaleY + newBbox.y,
            };
          } else if (ann.type === 'path' && ann.attributes.points) {
            // Recalculate path points based on new bbox
            const scaleX = newBbox.w / oldBbox.w;
            const scaleY = newBbox.h / oldBbox.h;
            
            newAttributes = {
              ...newAttributes,
              points: ann.attributes.points.map((p: Point) => ({
                x: (p.x - oldBbox.x) * scaleX + newBbox.x,
                y: (p.y - oldBbox.y) * scaleY + newBbox.y,
              })),
            };
          } else if (ann.type === 'text') {
            // Scale font size proportionally
            const scale = Math.min(newBbox.w / oldBbox.w, newBbox.h / oldBbox.h);
            newAttributes = {
              ...newAttributes,
              fontSize: Math.max(8, Math.round((ann.attributes.fontSize || 16) * scale)),
            };
          }
          
          return { ...ann, bbox: newBbox, attributes: newAttributes };
        }
        return ann;
      }));
      
      setStartPoint(point);
      return;
    }
    
    // Drawing mode
    if (!isDrawing || !selectedTool) return;
    
    setCurrentPoint(point);
    
    if (selectedTool === 'freehand') {
      setPathPoints(prev => [...prev, point]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // End moving
    if (isMoving) {
      setIsMoving(false);
      setMoveStartPoint(null);
      return;
    }
    
    // End resizing
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setStartPoint(null);
      return;
    }
    
    // Drawing mode
    if (!isDrawing || !startPoint) return;
    
    const point = getCanvasCoordinates(e);
    const annotation = createAnnotation(selectedTool, startPoint, point, pathPoints, page);
    
    if (annotation) {
      setStoredAnnotations(prev => [...prev, annotation]);
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
          color: '#FF0000',
        },
        createdAt: new Date().toISOString(),
      };
      
      setStoredAnnotations(prev => [...prev, annotation]);
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

  const handleDelete = () => {
    if (selectedAnnotationId) {
      setStoredAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotationId));
      setSelectedAnnotationId(null);
    }
  };

  // Handle keyboard events for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedAnnotationId) {
        setStoredAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
      
      {selectedAnnotationId && (
        <button
          data-testid="delete-button"
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '8px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            zIndex: 1000,
          }}
        >
          削除 (Delete)
        </button>
      )}
    </div>
  );
};

export default DrawingCanvas;
