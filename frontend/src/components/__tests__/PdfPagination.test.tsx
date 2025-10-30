import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PdfPagination } from '../PdfPagination';

describe('PdfPagination', () => {
  test('shows initial page and advances on next click', () => {
    render(<PdfPagination numPages={5} initialPage={1} />);
    const indicator = screen.getByTestId('page-indicator');
    expect(indicator).toHaveTextContent('1 / 5');

    const next = screen.getByLabelText('next');
    fireEvent.click(next);
    expect(indicator).toHaveTextContent('2 / 5');
  });

  test('calls onPageChange when page changes', () => {
    const onPageChange = jest.fn();
    render(<PdfPagination numPages={3} initialPage={2} onPageChange={onPageChange} />);
    const prev = screen.getByLabelText('prev');
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
