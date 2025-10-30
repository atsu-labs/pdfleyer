import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PdfViewer from '../PdfViewer';

// Create a mock factory to allow per-test behavior
let mockGetDocument: any;

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => {
  return {
    getDocument: (url: string) => mockGetDocument(url),
    GlobalWorkerOptions: { workerSrc: '' }
  };
});

describe('PdfViewer', () => {
  beforeEach(() => {
    // Default successful mock
    mockGetDocument = (_url: string) => {
      const page = {
        getViewport: ({ scale }: any) => ({ width: 100 * scale, height: 150 * scale }),
        render: ({ canvasContext }: any) => ({ promise: Promise.resolve(canvasContext) })
      };
      return {
        promise: Promise.resolve({
          numPages: 1,
          getPage: (_n: number) => Promise.resolve(page)
        })
      };
    };
  });

  test('renders a canvas and invokes pdf rendering', async () => {
    render(<PdfViewer url="/some.pdf" />);
    const canvas = await waitFor(() => screen.getByTestId('pdf-canvas'));
    expect(canvas).toBeInTheDocument();
    // further assertions are covered by mock resolving without errors
  });

  test('displays error message when PDF fails to load', async () => {
    // Setup mock to fail
    mockGetDocument = () => ({
      promise: Promise.reject(new Error('Failed to load PDF document'))
    });

    render(<PdfViewer url="/invalid.pdf" />);
    
    // Should show loading initially
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
    
    // Should show error message after failure
    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load PDF document/)).toBeInTheDocument();
    });
    
    // Canvas should be hidden when error occurs
    const canvas = screen.getByTestId('pdf-canvas');
    expect(canvas).toHaveStyle({ display: 'none' });
  });

  test('displays error message when PDF page rendering fails', async () => {
    // Setup mock where getPage fails
    mockGetDocument = () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: () => Promise.reject(new Error('Failed to render page'))
      })
    });

    render(<PdfViewer url="/corrupt.pdf" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to render page/)).toBeInTheDocument();
    });
  });

  test('displays user-friendly error for network issues', async () => {
    // Setup mock to simulate network error
    mockGetDocument = () => ({
      promise: Promise.reject(new Error('NetworkError: Failed to fetch'))
    });

    render(<PdfViewer url="https://example.com/file.pdf" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      expect(screen.getByText(/NetworkError/)).toBeInTheDocument();
    });
  });

  test('displays error for invalid PDF format', async () => {
    // Setup mock to simulate invalid format
    mockGetDocument = () => ({
      promise: Promise.reject(new Error('Invalid PDF structure'))
    });

    render(<PdfViewer url="/notapdf.txt" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid PDF structure/)).toBeInTheDocument();
    });
  });

  test('hides loading indicator when error occurs', async () => {
    mockGetDocument = () => ({
      promise: Promise.reject(new Error('Test error'))
    });

    render(<PdfViewer url="/error.pdf" />);
    
    // Initially loading should be visible
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
    
    // After error, loading should be gone
    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
    });
  });

  test('calls onLoadSuccess with number of pages', async () => {
    const onLoadSuccess = jest.fn();
    mockGetDocument = () => {
      const page = {
        getViewport: ({ scale }: any) => ({ width: 100 * scale, height: 150 * scale }),
        render: ({ canvasContext }: any) => ({ promise: Promise.resolve(canvasContext) })
      };
      return {
        promise: Promise.resolve({
          numPages: 5,
          getPage: (_n: number) => Promise.resolve(page)
        })
      };
    };

    render(<PdfViewer url="/multi-page.pdf" onLoadSuccess={onLoadSuccess} />);
    
    await waitFor(() => {
      expect(onLoadSuccess).toHaveBeenCalledWith(5);
    });
  });

  test('renders specific page when page prop changes', async () => {
    const page1 = {
      getViewport: ({ scale }: any) => ({ width: 100 * scale, height: 150 * scale }),
      render: ({ canvasContext }: any) => {
        if (canvasContext) {
          (canvasContext as any).pageNumber = 1;
        }
        return { promise: Promise.resolve(canvasContext) };
      }
    };
    
    const page2 = {
      getViewport: ({ scale }: any) => ({ width: 100 * scale, height: 150 * scale }),
      render: ({ canvasContext }: any) => {
        if (canvasContext) {
          (canvasContext as any).pageNumber = 2;
        }
        return { promise: Promise.resolve(canvasContext) };
      }
    };

    const getPageMock = jest.fn((n: number) => {
      return Promise.resolve(n === 1 ? page1 : page2);
    });

    mockGetDocument = () => ({
      promise: Promise.resolve({
        numPages: 3,
        getPage: getPageMock
      })
    });

    const { rerender } = render(<PdfViewer url="/test.pdf" page={1} />);
    
    await waitFor(() => {
      expect(getPageMock).toHaveBeenCalledWith(1);
    });

    // Change to page 2
    rerender(<PdfViewer url="/test.pdf" page={2} />);
    
    await waitFor(() => {
      expect(getPageMock).toHaveBeenCalledWith(2);
    });
  });
});
