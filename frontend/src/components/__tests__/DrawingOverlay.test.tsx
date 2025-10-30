import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrawingOverlay from '../DrawingOverlay';

describe('DrawingOverlay', () => {
  const mockOnAnnotationCreate = jest.fn();
  const defaultProps = {
    width: 800,
    height: 600,
    onAnnotationCreate: mockOnAnnotationCreate,
  };

  beforeEach(() => {
    mockOnAnnotationCreate.mockClear();
  });

  describe('Tool Selection', () => {
    test('renders with no tool selected by default', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      expect(canvas).toBeInTheDocument();
    });

    test('can select rectangle tool', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const rectButton = screen.getByTestId('tool-rect');
      fireEvent.click(rectButton);
      expect(rectButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can select circle tool', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const circleButton = screen.getByTestId('tool-circle');
      fireEvent.click(circleButton);
      expect(circleButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can select line tool', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const lineButton = screen.getByTestId('tool-line');
      fireEvent.click(lineButton);
      expect(lineButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can select freehand tool', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const freehandButton = screen.getByTestId('tool-freehand');
      fireEvent.click(freehandButton);
      expect(freehandButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('can select text tool', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const textButton = screen.getByTestId('tool-text');
      fireEvent.click(textButton);
      expect(textButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('only one tool can be selected at a time', () => {
      render(<DrawingOverlay {...defaultProps} />);
      const rectButton = screen.getByTestId('tool-rect');
      const circleButton = screen.getByTestId('tool-circle');
      
      fireEvent.click(rectButton);
      expect(rectButton).toHaveAttribute('aria-pressed', 'true');
      
      fireEvent.click(circleButton);
      expect(circleButton).toHaveAttribute('aria-pressed', 'true');
      expect(rectButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Rectangle Drawing', () => {
    test('creates rectangle annotation on mouse drag', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const rectButton = screen.getByTestId('tool-rect');
      
      fireEvent.click(rectButton);
      
      // Simulate drawing a rectangle
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      await waitFor(() => {
        expect(mockOnAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'rect',
            bbox: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
              w: expect.any(Number),
              h: expect.any(Number),
            }),
          })
        );
      });
    });
  });

  describe('Circle Drawing', () => {
    test('creates circle annotation on mouse drag', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const circleButton = screen.getByTestId('tool-circle');
      
      fireEvent.click(circleButton);
      
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
      fireEvent.mouseUp(canvas, { clientX: 250, clientY: 250 });
      
      await waitFor(() => {
        expect(mockOnAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'circle',
            bbox: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
              w: expect.any(Number),
              h: expect.any(Number),
            }),
          })
        );
      });
    });
  });

  describe('Line Drawing', () => {
    test('creates line annotation on mouse drag', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const lineButton = screen.getByTestId('tool-line');
      
      fireEvent.click(lineButton);
      
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 300, clientY: 150 });
      
      await waitFor(() => {
        expect(mockOnAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'line',
            bbox: expect.any(Object),
            attributes: expect.objectContaining({
              startX: expect.any(Number),
              startY: expect.any(Number),
              endX: expect.any(Number),
              endY: expect.any(Number),
            }),
          })
        );
      });
    });
  });

  describe('Freehand Drawing', () => {
    test('creates freehand path annotation on mouse drag', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const freehandButton = screen.getByTestId('tool-freehand');
      
      fireEvent.click(freehandButton);
      
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 105 });
      fireEvent.mouseMove(canvas, { clientX: 120, clientY: 115 });
      fireEvent.mouseMove(canvas, { clientX: 130, clientY: 120 });
      fireEvent.mouseUp(canvas, { clientX: 130, clientY: 120 });
      
      await waitFor(() => {
        expect(mockOnAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'path',
            attributes: expect.objectContaining({
              points: expect.any(Array),
            }),
          })
        );
      });
    });
  });

  describe('Text Tool', () => {
    test('creates text annotation on click', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const textButton = screen.getByTestId('tool-text');
      
      fireEvent.click(textButton);
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
      
      // Should show text input
      const textInput = await screen.findByTestId('text-input');
      expect(textInput).toBeInTheDocument();
      
      // Type text and confirm
      fireEvent.change(textInput, { target: { value: 'Test annotation' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockOnAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text',
            bbox: expect.any(Object),
            attributes: expect.objectContaining({
              text: 'Test annotation',
            }),
          })
        );
      });
    });

    test('cancels text creation on Escape', async () => {
      render(<DrawingOverlay {...defaultProps} />);
      const canvas = screen.getByTestId('drawing-canvas');
      const textButton = screen.getByTestId('tool-text');
      
      fireEvent.click(textButton);
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
      
      const textInput = await screen.findByTestId('text-input');
      fireEvent.change(textInput, { target: { value: 'Test' } });
      fireEvent.keyDown(textInput, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('text-input')).not.toBeInTheDocument();
      });
      
      expect(mockOnAnnotationCreate).not.toHaveBeenCalled();
    });
  });

  describe('Canvas Rendering', () => {
    test('sets canvas dimensions from props', () => {
      render(<DrawingOverlay {...defaultProps} width={1024} height={768} />);
      const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });
  });
});
