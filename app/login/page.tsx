'use client';

import { useState, useEffect, Suspense } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Store } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoginForm() {
  const [formData, setFormData] = useState({
    identifier: '', // Changed from 'email' to 'identifier'
    password: '',
    preferredLanguage: 'fr',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  console.log('Login page rendered');

  const handleInputChange = (field: string, value: string) => {
    console.log(`Login form field changed: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log('Login response received:', data);

      if (!response.ok) {
        setError(data.error || 'Login failed');
        console.error('Login failed:', data.error);
        return;
      }

      console.log('Login successful, redirecting to dashboard');
      showSuccess('Connexion réussie! Redirection en cours...');

      // Store user data in localStorage for dashboard display
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to the original page or dashboard
      const redirectTo = (searchParams?.get('redirect')) || '/dashboard';
      console.log('Redirecting to:', redirectTo);

      // Add a small delay to ensure cookie is set properly
      setTimeout(() => {
        console.log('Executing redirect now...');
        router.push(redirectTo);
        // Force page reload as fallback
        if (redirectTo === '/dashboard') {
          window.location.href = '/dashboard';
        }
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center p-4" data-macaly="login-container">
      <Card className="w-full max-w-md shadow-notion-lg border-0 bg-white" data-macaly="login-card">
        <CardHeader className="text-center space-y-4" data-macaly="login-header">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#0075de] rounded-notion-card flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-card-title font-bold text-[rgba(0,0,0,0.95)]" data-macaly="login-title">
              Tijara CRM
            </CardTitle>
            <CardDescription className="text-[#615d59] mt-2" data-macaly="login-subtitle">
              Connectez-vous à votre espace de gestion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6" data-macaly="login-form">
          {error && (
            <Alert variant="destructive" data-macaly="login-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Email ou Téléphone / البريد الإلكتروني أو الهاتف
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="votre@email.com ou 06XXXXXXXX"
                value={formData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                className="h-11"
                disabled={loading}
                required
                data-macaly="identifier-input"
              />
              <p className="text-xs text-gray-500">
                Vous pouvez utiliser votre email ou numéro de téléphone
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
                required
                data-macaly="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
              data-macaly="login-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-[rgba(0,0,0,0.06)]">
            <p className="text-sm text-[#615d59]">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="font-medium text-[#0075de] hover:text-[#005bab] transition-colors"
                data-macaly="register-link"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0075de]" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}