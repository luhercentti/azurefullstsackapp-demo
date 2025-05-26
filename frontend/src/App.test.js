import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

test('renders task manager title', async () => {
  // Mock the initial API call
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  await act(async () => {
    render(<App />);
  });

  // Wait for the loading to complete and title to appear
  await waitFor(() => {
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
  });
});

test('displays loading state initially', () => {
  // Mock a delayed API response
  fetch.mockImplementationOnce(() => 
    new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => []
    }), 100))
  );

  render(<App />);
  
  // Should show loading spinner initially
  expect(document.querySelector('.animate-spin')).toBeInTheDocument();
});

test('displays empty state when no tasks', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  await act(async () => {
    render(<App />);
  });
  
  await waitFor(() => {
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });
});

test('displays tasks when loaded', async () => {
  const mockTasks = [
    { id: 1, title: 'Test task 1', completed: false },
    { id: 2, title: 'Test task 2', completed: true }
  ];

  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks
  });

  await act(async () => {
    render(<App />);
  });
  
  await waitFor(() => {
    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });
});

test('can add new task', async () => {
  // Mock initial empty tasks
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  // Mock add task response
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: 1, title: 'New task', completed: false })
  });

  await act(async () => {
    render(<App />);
  });
  
  await waitFor(() => {
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText(/Add a new task/i);
  const addButton = screen.getByRole('button', { name: /Add/i });

  await act(async () => {
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.click(addButton);
  });

  await waitFor(() => {
    expect(screen.getByText('New task')).toBeInTheDocument();
  });
});

test('handles API error gracefully', async () => {
  fetch.mockRejectedValueOnce(new Error('API Error'));

  await act(async () => {
    render(<App />);
  });
  
  await waitFor(() => {
    expect(screen.getByText(/Failed to load tasks/i)).toBeInTheDocument();
  });
});

test('can toggle task completion', async () => {
  const mockTasks = [
    { id: 1, title: 'Test task', completed: false }
  ];

  // Mock initial tasks
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks
  });

  // Mock toggle response
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: 1, title: 'Test task', completed: true })
  });

  await act(async () => {
    render(<App />);
  });
  
  await waitFor(() => {
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  const toggleButton = document.querySelector('button[class*="rounded-full"]');
  
  await act(async () => {
    fireEvent.click(toggleButton);
  });

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks/1'),
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })
    );
  });
});