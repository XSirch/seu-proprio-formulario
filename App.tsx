
import React, { useState, useEffect } from 'react';
import { Form, Submission, INITIAL_FIELDS, FormField, User, FormTheme } from './types';
import { HomePage } from './components/HomePage';
import { FormBuilder } from './components/FormBuilder';
import { ResponseViewer } from './components/ResponseViewer';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { PublicFormView } from './components/PublicFormView';
import { SettingsPage } from './components/SettingsPage';
import * as api from './services/api';

type ViewState = 'landing' | 'auth-login' | 'auth-signup' | 'home' | 'builder' | 'responses' | 'public-form' | 'settings';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);

  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [pendingXp, setPendingXp] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicFormId, setPublicFormId] = useState<string | null>(null);

  // Helper to get current form
  const selectedForm = forms.find(f => f.id === selectedFormId);

  // Check for public form route on mount
  useEffect(() => {
    const path = window.location.pathname;
    // Updated regex to match UUIDs (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const formMatch = path.match(/^\/form\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);

    if (formMatch) {
      const formId = formMatch[1];
      setPublicFormId(formId);
      setView('public-form');
      return;
    }

    // Check for existing auth token
    const token = api.getAuthToken();
    if (token) {
      // Token exists, try to load user data
      loadUserData();
    }
  }, []);

  // Load user forms when user logs in
  useEffect(() => {
    if (user && view === 'home') {
      loadForms();
    }
  }, [user, view]);

  // Load submissions when viewing responses
  useEffect(() => {
    if (selectedFormId && view === 'responses') {
      loadSubmissions(selectedFormId);
    }
  }, [selectedFormId, view]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData, formsData] = await Promise.all([
        api.getCurrentUser(),
        api.getForms(),
      ]);
      setUser(userData);
      setForms(formsData);
      setView('home');
    } catch (err) {
      console.error('Failed to load user data:', err);
      api.clearAuthToken();
      setUser(null);
      setView('landing');
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async () => {
    try {
      setLoading(true);
      const formsData = await api.getForms();
      setForms(formsData);
    } catch (err) {
      console.error('Failed to load forms:', err);
      setError('Falha ao carregar formulários');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (formId: string) => {
    try {
      setLoading(true);
      const submissionsData = await api.getSubmissions(formId);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Falha ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  // --- Auth Actions ---
  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setPendingXp(0);
    setView('home');
  };

  const handleLogout = () => {
    api.clearAuthToken();
    setUser(null);
    setForms([]);
    setSubmissions([]);
    setView('landing');
  };

  // --- App Actions ---
  const handleCreateForm = () => {
    setSelectedFormId(null); // No ID means creating new
    setView('builder');
  };

  const handleEditForm = (form: Form) => {
    setSelectedFormId(form.id);
    setView('builder');
  };

  const handleViewResponses = (form: Form) => {
    setSelectedFormId(form.id);
    setView('responses');
  };

  const handleDeleteForm = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este formulário?')) {
      try {
        setLoading(true);
        await api.deleteForm(id);
        setForms(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        console.error('Failed to delete form:', err);
        setError('Falha ao excluir formulário');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveForm = async (title: string, fields: FormField[], theme?: FormTheme, logoUrl?: string, description?: string) => {
    try {
      setLoading(true);
      if (selectedFormId) {
        // Update existing
        const updatedForm = await api.updateForm(selectedFormId, title, fields, theme, logoUrl, description);
        setForms(prev => prev.map(f => f.id === selectedFormId ? updatedForm : f));
      } else {
        // Create new
        const newForm = await api.createForm(title, fields, theme, logoUrl, description);
        setForms(prev => [newForm, ...prev]);
      }
      setView('home');
    } catch (err) {
      console.error('Failed to save form:', err);
      setError('Falha ao salvar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSubmit = async (answers: Record<string, any>) => {
    if (selectedFormId) {
      try {
        const newSubmission = await api.createSubmission(selectedFormId, answers);
        setSubmissions(prev => [newSubmission, ...prev]);
        setForms(prev => prev.map(f => f.id === selectedFormId ? { ...f, responseCount: f.responseCount + 1 } : f));
      } catch (err) {
        console.error('Failed to submit form:', err);
      }
    }
  }

  const handleSignupFromPreview = (earnedXp: number) => {
    setPendingXp(earnedXp);
    setView('auth-signup');
  }

  // --- Router Logic ---

  // Public form view (no authentication required)
  if (view === 'public-form' && publicFormId) {
    return <PublicFormView formId={publicFormId} />;
  }

  if (!user) {
    if (view === 'auth-login' || view === 'auth-signup') {
      return (
        <AuthPage
          type={view === 'auth-login' ? 'login' : 'signup'}
          pendingXp={pendingXp}
          onAuthSuccess={handleLoginSuccess}
          onSwitchMode={(mode) => setView(mode === 'login' ? 'auth-login' : 'auth-signup')}
          onBack={() => setView('landing')}
        />
      );
    }
    // Default fallback for unauthenticated is Landing
    return (
      <LandingPage
        onStart={() => setView('auth-signup')}
        onLogin={() => setView('auth-login')}
      />
    );
  }

  // Authenticated Routes
  if (view === 'settings' && user) {
    return (
      <SettingsPage
        user={user}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'builder') {
    return (
      <FormBuilder
        initialFields={selectedForm ? selectedForm.fields : [INITIAL_FIELDS[0]]}
        initialTitle={selectedForm ? selectedForm.title : 'Meu Novo Formulário'}
        initialDescription={selectedForm?.description}
        initialTheme={selectedForm?.theme}
        initialLogo={selectedForm?.logoUrl}
        formId={selectedForm?.id}
        onSave={handleSaveForm}
        onBack={() => setView('home')}
        onPreviewSubmit={handlePreviewSubmit}
        onSignup={handleSignupFromPreview}
        user={user}
      />
    );
  }

  if (view === 'responses' && selectedForm) {
    return (
      <ResponseViewer
        form={selectedForm}
        submissions={submissions.filter(s => s.formId === selectedForm.id)}
        onBack={() => setView('home')}
      />
    );
  }

  // Default Authenticated: Dashboard
  return (
    <HomePage
      forms={forms}
      user={user}
      onCreateForm={handleCreateForm}
      onEditForm={handleEditForm}
      onViewResponses={handleViewResponses}
      onDeleteForm={handleDeleteForm}
      onLogout={handleLogout}
      onOpenSettings={() => setView('settings')}
    />
  );
}

export default App;
