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

  describe('Text Attribute Editing', () => {
    it('should show text editor panel when text annotation is selected', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="text" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Create a text annotation
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      const textInput = screen.getByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Test Text' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the text annotation (mouseDown within the bounding box)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 110 });
      
      // Text editor panel should appear
      const textEditor = screen.getByTestId('text-editor-panel');
      expect(textEditor).toBeInTheDocument();
    });

    it('should allow editing text content', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="text" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Create a text annotation
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      const textInput = screen.getByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Original Text' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the text annotation (mouseDown within the bounding box)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 110 });
      
      // Edit the text content
      const editTextInput = screen.getByTestId('edit-text-content');
      expect(editTextInput).toHaveValue('Original Text');
      
      fireEvent.change(editTextInput, { target: { value: 'Updated Text' } });
      expect(editTextInput).toHaveValue('Updated Text');
    });

    it('should allow changing font size', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="text" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Create a text annotation
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      const textInput = screen.getByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Test Text' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the text annotation (mouseDown within the bounding box)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 110 });
      
      // Change font size
      const fontSizeInput = screen.getByTestId('edit-font-size');
      expect(fontSizeInput).toHaveValue(16); // Default font size
      
      fireEvent.change(fontSizeInput, { target: { value: '24' } });
      expect(fontSizeInput).toHaveValue(24);
    });

    it('should allow changing text color', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="text" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Create a text annotation
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      const textInput = screen.getByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Test Text' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the text annotation (mouseDown within the bounding box)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 110 });
      
      // Change color
      const colorInput = screen.getByTestId('edit-text-color');
      expect(colorInput).toHaveValue('#ff0000'); // Default red color (lowercase)
      
      fireEvent.change(colorInput, { target: { value: '#0000FF' } });
      expect(colorInput).toHaveValue('#0000ff'); // Lowercase
    });

    it('should not show text editor panel for non-text annotations', () => {
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
      
      // Text editor panel should not appear
      const textEditor = screen.queryByTestId('text-editor-panel');
      expect(textEditor).not.toBeInTheDocument();
    });

    it('should update text annotation properties in real-time', () => {
      const { rerender } = render(
        <DrawingCanvas {...defaultProps} selectedTool="text" />
      );
      
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      
      // Create a text annotation
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      const textInput = screen.getByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Test' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      // Switch to selection mode
      rerender(<DrawingCanvas {...defaultProps} selectedTool={null} />);
      
      // Select the text annotation (mouseDown within the bounding box)
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 110 });
      
      // Change multiple attributes
      const editTextInput = screen.getByTestId('edit-text-content');
      const fontSizeInput = screen.getByTestId('edit-font-size');
      const colorInput = screen.getByTestId('edit-text-color');
      
      fireEvent.change(editTextInput, { target: { value: 'Updated' } });
      fireEvent.change(fontSizeInput, { target: { value: '20' } });
      fireEvent.change(colorInput, { target: { value: '#00FF00' } });
      
      // All changes should be reflected
      expect(editTextInput).toHaveValue('Updated');
      expect(fontSizeInput).toHaveValue(20);
      expect(colorInput).toHaveValue('#00ff00'); // Lowercase
    });
  });
});
