import { Form, Submission, User } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper to get auth token from localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Helper to set auth token
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

// Helper to clear auth token
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
}

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearAuthToken();
    throw new Error('Authentication failed. Please login again.');
  }

  return response;
}

// ===== AUTH API =====

export async function signup(name: string, email: string, password: string, pendingXp: number = 0): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, pendingXp }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  const data = await response.json();
  setAuthToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  setAuthToken(data.token);
  return data;
}

// Get current authenticated user
export async function getCurrentUser(): Promise<User> {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}


// ===== FORMS API =====

export async function getForms(): Promise<Form[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/forms`);

  if (!response.ok) {
    throw new Error('Failed to fetch forms');
  }

  return response.json();
}

export async function createForm(title: string, fields: any[], theme?: any, logoUrl?: string, description?: string): Promise<Form> {
  const response = await fetchWithAuth(`${API_BASE_URL}/forms`, {
    method: 'POST',
    body: JSON.stringify({ title, fields, theme, logoUrl, description }),
  });

  if (!response.ok) {
    throw new Error('Failed to create form');
  }

  return response.json();
}

export async function updateForm(id: string, title: string, fields: any[], theme?: any, logoUrl?: string, description?: string): Promise<Form> {
  const response = await fetchWithAuth(`${API_BASE_URL}/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, fields, theme, logoUrl, description }),
  });

  if (!response.ok) {
    throw new Error('Failed to update form');
  }

  return response.json();
}

export async function deleteForm(id: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/forms/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete form');
  }
}

// ===== SUBMISSIONS API =====

export async function getSubmissions(formId: string): Promise<Submission[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/submissions/${formId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }

  return response.json();
}

export async function createSubmission(formId: string, answers: Record<string, any>): Promise<Submission> {
  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formId, answers }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit form');
  }

  return response.json();
}

