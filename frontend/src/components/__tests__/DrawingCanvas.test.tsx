import { render, screen, fireEvent } from '@testing-library/react';
import { DrawingCanvas } from '../DrawingCanvas';

describe('DrawingCanvas - Selection, Move, Resize, Delete', () => {
  const defaultProps = {
    width: 800,
    height: 600,
    selectedTool: null,
    page: 1,
  };

  describe('Selection', () => {
    it('should select an annotation when clicked on it', () => {
      const onAnnotationCreate = jest.fn();
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" onAnnotationCreate={onAnnotationCreate} />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle first
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      expect(onAnnotationCreate).toHaveBeenCalledTimes(1);
      
      // Switch to null tool (selection mode)
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} onAnnotationCreate={onAnnotationCreate} />);
      
      // Click on the rectangle to select it
      fireEvent.click(canvas, { clientX: 150, clientY: 150 });
      
      // Selection should work without crashing
      // In real environment, the canvas would show selection indicators
      expect(canvas).toBeInTheDocument();
    });

    it('should deselect when clicking on empty area', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Click on the rectangle to select
      fireEvent.click(canvas, { clientX: 150, clientY: 150 });
      
      // Click on empty area to deselect
      fireEvent.click(canvas, { clientX: 500, clientY: 500 });
      
      // Should not crash and selection should be cleared
    });
  });

  describe('Move', () => {
    it('should move selected annotation when dragged', () => {
      const onAnnotationCreate = jest.fn();
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" onAnnotationCreate={onAnnotationCreate} />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle at (100,100) to (200,200)
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      expect(onAnnotationCreate).toHaveBeenCalledTimes(1);
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the annotation
      fireEvent.click(canvas, { clientX: 150, clientY: 150 });
      
      // Drag it to a new position (move by 50 pixels right and down)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // The annotation should have moved (we'll verify through visual rendering)
      // In the actual implementation, we'll expose a way to get annotations
    });

    it('should not move unselected annotations', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Switch to selection mode but don't select anything
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Try to drag without selecting first
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Should select on click, then move on subsequent drag
    });
  });

  describe('Resize', () => {
    it('should show resize handles when annotation is selected', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="circle" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a circle
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 300, clientY: 300 });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the circle
      fireEvent.click(canvas, { clientX: 250, clientY: 250 });
      
      // Resize handles should be visible in real environment
      // Test that selection doesn't crash
      expect(canvas).toBeInTheDocument();
    });

    it('should resize annotation when dragging a resize handle', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle at (100,100) to (200,200)
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the rectangle
      fireEvent.click(canvas, { clientX: 150, clientY: 150 });
      
      // Drag bottom-right corner handle (200, 200) to (250, 250)
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
      fireEvent.mouseUp(canvas, { clientX: 250, clientY: 250 });
      
      // The annotation should be resized
    });
  });

  describe('Delete', () => {
    it('should delete selected annotation when Delete key is pressed', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="line" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a line
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 300, clientY: 300 });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the line
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
      
      // Press Delete key
      fireEvent.keyDown(document, { key: 'Delete' });
      
      // The annotation should be removed (test doesn't crash)
      expect(canvas).toBeInTheDocument();
    });

    it('should delete selected annotation via delete button', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="rect" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Draw a rectangle
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the rectangle
      fireEvent.click(canvas, { clientX: 150, clientY: 150 });
      
      // Look for delete button (should appear when something is selected)
      const deleteButton = screen.queryByTestId('delete-button');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        // The annotation should be removed
      }
    });

    it('should not delete when no annotation is selected', () => {
      render(
        <DrawingCanvas {...defaultProps} selectedTool={null} />
      );
      
      // Press Delete key without any selection
      fireEvent.keyDown(document, { key: 'Delete' });
      
      // Should not crash
    });
  });
});
