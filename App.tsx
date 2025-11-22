
import React, { useState } from 'react';
import { Form, Submission, INITIAL_FIELDS, FormField, User, FormTheme, calculateLevel } from './types';
import { HomePage } from './components/HomePage';
import { FormBuilder } from './components/FormBuilder';
import { ResponseViewer } from './components/ResponseViewer';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';

// Mock initial data
const MOCK_FORMS: Form[] = [
  {
    id: '1',
    title: 'Satisfação do Cliente',
    createdAt: new Date().toISOString(),
    responseCount: 3,
    fields: INITIAL_FIELDS,
    theme: {
        backgroundColor: '#0f172a',
        primaryColor: '#14b8a6',
        textColor: '#ffffff'
    }
  },
  {
      id: '2',
      title: 'Feedback de Funcionários',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      responseCount: 0,
      fields: []
  }
];

const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: '101',
        formId: '1',
        submittedAt: new Date(Date.now() - 3600000).toISOString(),
        answers: {
            '1': 'Alice Wonderland',
            '2': 5
        }
    },
    {
        id: '102',
        formId: '1',
        submittedAt: new Date(Date.now() - 7200000).toISOString(),
        answers: {
            '1': 'Bob Builder',
            '2': 4
        }
    },
     {
        id: '103',
        formId: '1',
        submittedAt: new Date(Date.now() - 10000000).toISOString(),
        answers: {
            '1': 'Charlie Bucket',
            '2': 5
        }
    }
];

type ViewState = 'landing' | 'auth-login' | 'auth-signup' | 'home' | 'builder' | 'responses';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);

  const [forms, setForms] = useState<Form[]>(MOCK_FORMS);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [pendingXp, setPendingXp] = useState<number>(0);

  // Helper to get current form
  const selectedForm = forms.find(f => f.id === selectedFormId);

  // --- Auth Actions ---
  const handleLoginSuccess = (userData: { name: string; email: string }) => {
      const initialXp = pendingXp > 0 ? pendingXp : 500; // Bonus for signup if no pending XP
      setUser({
          id: 'u-123',
          name: userData.name,
          email: userData.email,
          avatar: '',
          xp: initialXp,
          level: calculateLevel(initialXp)
      });
      setPendingXp(0); // Clear pending
      setView('home');
  };

  const handleLogout = () => {
      setUser(null);
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

  const handleDeleteForm = (id: string) => {
      if(window.confirm('Tem certeza que deseja excluir este formulário?')) {
          setForms(prev => prev.filter(f => f.id !== id));
      }
  };

  const handleSaveForm = (title: string, fields: FormField[], theme?: FormTheme, logoUrl?: string) => {
    if (selectedFormId) {
      // Update existing
      setForms(prev => prev.map(f => f.id === selectedFormId ? { ...f, title, fields, theme, logoUrl } : f));
    } else {
      // Create new
      const newForm: Form = {
        id: Date.now().toString(),
        title: title || 'Formulário Sem Título',
        fields,
        theme,
        logoUrl,
        createdAt: new Date().toISOString(),
        responseCount: 0
      };
      setForms(prev => [newForm, ...prev]);
    }
    setView('home');
  };

  const handlePreviewSubmit = (answers: Record<string, any>) => {
      if (selectedFormId) {
          const newSubmission: Submission = {
              id: Date.now().toString(),
              formId: selectedFormId,
              submittedAt: new Date().toISOString(),
              answers
          };
          setSubmissions(prev => [newSubmission, ...prev]);
          setForms(prev => prev.map(f => f.id === selectedFormId ? { ...f, responseCount: f.responseCount + 1} : f));
      }
      console.log("Preview submission:", answers);
  }

  const handleSignupFromPreview = (earnedXp: number) => {
      setPendingXp(earnedXp);
      setView('auth-signup');
  }

  // --- Router Logic ---

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
  if (view === 'builder') {
    return (
      <FormBuilder
        initialFields={selectedForm ? selectedForm.fields : [INITIAL_FIELDS[0]]}
        initialTitle={selectedForm ? selectedForm.title : 'Meu Novo Formulário'}
        initialTheme={selectedForm?.theme}
        initialLogo={selectedForm?.logoUrl}
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
    />
  );
}

export default App;
