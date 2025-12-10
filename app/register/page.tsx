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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Store, Globe, Mail, Phone, MapPin, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguageContext } from '@/components/LanguageProvider';
import type { RegisterOwnerData } from '@/lib/validations';

function RegisterForm() {
  const { t, locale } = useLanguageContext();
  const [formData, setFormData] = useState<Partial<RegisterOwnerData>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    preferredLanguage: 'fr',
    shopName: '',
    shopAddress: '',
    shopCategory: '',
    shopPhone: '',
    shopDescription: '',
  });
  const [registrationType, setRegistrationType] = useState<'email' | 'phone'>('email');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  console.log('Register page rendered');

  // Pre-fill form data from URL parameters (from landing page)
  useEffect(() => {
    const name = searchParams?.get('name');
    const phone = searchParams?.get('phone');
    const email = searchParams?.get('email');

    if (phone && !email) {
      setRegistrationType('phone');
      setFormData(prev => ({ ...prev, phone }));
    } else if (email) {
      setRegistrationType('email');
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Register form field changed: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
    if (success) setSuccess(''); // Clear success when user changes form
  };

  const handleNext = () => {
    setCurrentStep(2);
    setError('');
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Owner registration form submitted');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Register response received:', data);

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((detail: any) => detail.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.message || 'Registration failed');
        }
        return;
      }

      // Success - save user data to localStorage
      localStorage.setItem('user', JSON.stringify({
        name: data.user?.name || formData.name,
        email: data.user?.email || formData.email,
        role: data.user?.role || 'owner'
      }));

      setSuccess('Account created successfully! Redirecting...');
      console.log('Registration successful, redirecting to dashboard');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4" data-macaly="register-container">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/95 backdrop-blur-sm" data-macaly="register-card">
        <CardHeader className="text-center space-y-4" data-macaly="register-header">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-amber-500 rounded-xl flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900" data-macaly="register-title">
              {t('register.title')}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2" data-macaly="register-subtitle">
              {t('register.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6" data-macaly="register-form">
          {error && (
            <Alert variant="destructive" data-macaly="register-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800" data-macaly="register-success">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
            </div>

            {/* Step 1: Owner Information */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
                  <p className="text-sm text-gray-600">Create your account as shop owner</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                    data-macaly="name-input"
                  />
                </div>

                {/* Registration Type Tabs */}
                <Tabs value={registrationType} onValueChange={(value) => {
                  setRegistrationType(value as 'email' | 'phone');
                  setFormData(prev => ({ ...prev, email: '', phone: '' }));
                  setError('');
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="space-y-2 mt-4">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="owner@example.com"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                      required={registrationType === 'email'}
                      data-macaly="email-input"
                    />
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-2 mt-4">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0612345678 or +212612345678"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                      required={registrationType === 'phone'}
                      data-macaly="phone-input"
                    />
                    <p className="text-xs text-gray-500">
                      Format: 06XXXXXXXX or +212XXXXXXXXX
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a secure password"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                    data-macaly="password-input"
                  />
                  <p className="text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Preferred Language
                  </Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) => handleInputChange('preferredLanguage', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11" data-macaly="language-select">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200"
                  disabled={loading || !formData.name || !formData.password || (!formData.email && !formData.phone)}
                  data-macaly="next-button"
                >
                  Next: Shop Information
                </Button>
              </>
            )}

            {/* Step 2: Shop Information */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Shop Information</h3>
                  <p className="text-sm text-gray-600">Tell us about your shop</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Shop Name *
                  </Label>
                  <Input
                    id="shopName"
                    type="text"
                    placeholder="Your shop name"
                    value={formData.shopName || ''}
                    onChange={(e) => handleInputChange('shopName', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                    data-macaly="shop-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopAddress" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shop Address *
                  </Label>
                  <Input
                    id="shopAddress"
                    type="text"
                    placeholder="Complete shop address"
                    value={formData.shopAddress || ''}
                    onChange={(e) => handleInputChange('shopAddress', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                    data-macaly="shop-address-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopCategory" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Shop Category *
                  </Label>
                  <Select
                    value={formData.shopCategory}
                    onValueChange={(value) => handleInputChange('shopCategory', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11" data-macaly="shop-category-select">
                      <SelectValue placeholder="Select shop category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grocery">Grocery Store</SelectItem>
                      <SelectItem value="clothing">Clothing Store</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Café</SelectItem>
                      <SelectItem value="hardware">Hardware Store</SelectItem>
                      <SelectItem value="bookstore">Bookstore</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopPhone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Shop Phone *
                  </Label>
                  <Input
                    id="shopPhone"
                    type="tel"
                    placeholder="0512345678"
                    value={formData.shopPhone || ''}
                    onChange={(e) => handleInputChange('shopPhone', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                    data-macaly="shop-phone-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopDescription" className="text-sm font-medium text-gray-700">
                    Shop Description
                  </Label>
                  <Textarea
                    id="shopDescription"
                    placeholder="Brief description of your shop (optional)"
                    value={formData.shopDescription || ''}
                    onChange={(e) => handleInputChange('shopDescription', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    rows={3}
                    maxLength={500}
                    data-macaly="shop-description-input"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-11"
                    disabled={loading}
                    data-macaly="back-button"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200"
                    disabled={loading || !formData.shopName || !formData.shopAddress || !formData.shopCategory || !formData.shopPhone}
                    data-macaly="register-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Shop & Account'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('register.cta.haveAccount')}{' '}
              <Link
                href={`/login?lang=${locale}`}
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                data-macaly="login-link"
              >
                {t('register.cta.login')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}