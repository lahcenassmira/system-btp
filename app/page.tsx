'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Users,
  CreditCard,
  BarChart3,
  Download,
  Upload,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguageContext } from '@/components/LanguageProvider';

export default function LandingPage() {
  const router = useRouter();
  const { locale, t } = useLanguageContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const handleGetStarted = () => {
    router.push(`/register?lang=${locale}`);
  };

  const handleLogin = () => {
    router.push(`/login?lang=${locale}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to register with pre-filled data
    const params = new URLSearchParams({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      lang: locale
    });
    router.push(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0075de] rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[rgba(0,0,0,0.95)]">{t('landing.brand')}</h1>
                <p className="text-xs text-[#a39e98] hidden sm:block">{t('landing.tagline')}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={handleLogin}>
                {t('landing.nav.login')}
              </Button>
              <Button onClick={handleGetStarted}>
                {t('landing.nav.tryFree')}
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[rgba(0,0,0,0.06)] py-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogin}>
                {t('landing.nav.login')}
              </Button>
              <Button className="w-full" onClick={handleGetStarted}>
                {t('landing.nav.tryFree')}
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#f2f9ff] via-white to-[#f6f5f4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Main Headlines */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-display font-bold text-[rgba(0,0,0,0.95)] leading-tight">
                <span className="block">{t('landing.hero.titleMain')}</span>
                <span className="block text-3xl md:text-section text-[#0075de] mt-2">
                  {t('landing.hero.subtitleBottom')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-[#615d59] max-w-3xl mx-auto leading-relaxed">
                <span className="block mb-2">{t('landing.hero.subtitleTop')}</span>
                <span className="block">{t('landing.hero.subtitleBottom')}</span>
              </p>
            </div>

            {/* Value Proposition */}
            <div className="bg-white/80 backdrop-blur-sm rounded-notion-card p-6 md:p-8 max-w-4xl mx-auto border border-[rgba(0,0,0,0.06)] shadow-notion-lg">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-[#f2f9ff] rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-[#0075de]" />
                  </div>
                  <h3 className="font-semibold text-[rgba(0,0,0,0.95)]">{t('landing.value.customers.title')}</h3>
                  <p className="text-sm text-[#615d59]">{t('landing.value.customers.subtitle')}</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-[#fff0e6] rounded-full flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6 text-[#dd5b00]" />
                  </div>
                  <h3 className="font-semibold text-[rgba(0,0,0,0.95)]">{t('landing.value.credit.title')}</h3>
                  <p className="text-sm text-[#615d59]">{t('landing.value.credit.subtitle')}</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-[#e6f7f6] rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-6 h-6 text-[#2a9d99]" />
                  </div>
                  <h3 className="font-semibold text-[rgba(0,0,0,0.95)]">{t('landing.value.analytics.title')}</h3>
                  <p className="text-sm text-[#615d59]">{t('landing.value.analytics.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-[#0075de] hover:bg-[#005bab] text-white px-8 py-4 text-lg font-semibold rounded-notion-card shadow-notion-md hover:shadow-notion-lg transition-all duration-200"
                onClick={handleGetStarted}
              >
                {t('landing.nav.tryFree')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-[#a39e98] px-8 py-4 text-lg font-semibold rounded-notion-card hover:bg-[#f6f5f4] transition-all duration-200"
                onClick={handleLogin}
              >
                {t('landing.nav.login')}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0075de]" />
                <span className="text-[#615d59]">{t('landing.trust.free')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0075de]" />
                <span className="text-[#615d59]">{t('landing.trust.easy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0075de]" />
                <span className="text-[#615d59]">{t('landing.trust.languages')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#f6f5f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="block">{t('landing.features.titleTop')}</span>
              <span className="block text-2xl md:text-3xl text-gray-600 mt-2">
                {t('landing.features.titleBottom')}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.descTop')}
              <br />
              {t('landing.features.descBottom')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-notion-md hover:shadow-notion-lg transition-all duration-300 bg-white">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-[#0075de] rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.features.cards.manageCustomers.title')}</h3>
                  <p className="text-gray-600 font-medium mb-3">{t('landing.features.cards.manageCustomers.subtitle')}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('landing.features.cards.manageCustomers.description')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-notion-md hover:shadow-notion-lg transition-all duration-300 bg-white">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-[#dd5b00] rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.features.cards.trackCredit.title')}</h3>
                  <p className="text-gray-600 font-medium mb-3">{t('landing.features.cards.trackCredit.subtitle')}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('landing.features.cards.trackCredit.description')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-notion-md hover:shadow-notion-lg transition-all duration-300 bg-white">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-[#1aae39] rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.features.cards.productStats.title')}</h3>
                  <p className="text-gray-600 font-medium mb-3">{t('landing.features.cards.productStats.subtitle')}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('landing.features.cards.productStats.description')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-notion-md hover:shadow-notion-lg transition-all duration-300 bg-white">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-[#391c57] rounded-2xl flex items-center justify-center mx-auto">
                  <div className="flex items-center gap-1">
                    <Upload className="w-4 h-4 text-white" />
                    <Download className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.features.cards.importExport.title')}</h3>
                  <p className="text-gray-600 font-medium mb-3">{t('landing.features.cards.importExport.subtitle')}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('landing.features.cards.importExport.description')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Benefits */}
          <div className="mt-16 bg-white rounded-notion-card p-8 shadow-notion-md">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#e6f7e9] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#1aae39]" />
                </div>
                <h4 className="font-semibold text-gray-900">{t('landing.benefits.free100.title')}</h4>
                <p className="text-sm text-gray-600">{t('landing.benefits.free100.caption')}</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#f2f9ff] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#0075de]" />
                </div>
                <h4 className="font-semibold text-gray-900">{t('landing.benefits.mobile.title')}</h4>
                <p className="text-sm text-gray-600">{t('landing.benefits.mobile.caption')}</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-[#f0e6f6] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#391c57]" />
                </div>
                <h4 className="font-semibold text-gray-900">{t('landing.benefits.simple.title')}</h4>
                <p className="text-sm text-gray-600">{t('landing.benefits.simple.caption')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="block">{t('landing.screens.titleTop')}</span>
              <span className="block text-2xl md:text-3xl text-gray-600 mt-2">
                {t('landing.screens.titleBottom')}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.screens.descTop')}
              <br />
              {t('landing.screens.descBottom')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Screenshot 1 - Dashboard */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#f2f9ff] to-[#dbeafe] rounded-notion-card p-8 aspect-[4/3] flex items-center justify-center border border-[rgba(0,117,222,0.12)]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#0075de] rounded-2xl flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-blue-300 rounded w-24 mx-auto"></div>
                    <div className="h-2 bg-blue-200 rounded w-16 mx-auto"></div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.screens.dashboard.title')}</h3>
                <p className="text-gray-600 font-medium mb-2">{t('landing.screens.dashboard.subtitle')}</p>
                <p className="text-sm text-gray-500">
                  {t('landing.screens.dashboard.description')}
                </p>
              </div>
            </div>

            {/* Screenshot 2 - Customer Management */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#e6f7e9] to-[#d4f0d9] rounded-notion-card p-8 aspect-[4/3] flex items-center justify-center border border-[rgba(26,174,57,0.12)]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1aae39] rounded-2xl flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-green-300 rounded w-28 mx-auto"></div>
                    <div className="h-2 bg-green-200 rounded w-20 mx-auto"></div>
                    <div className="h-2 bg-green-200 rounded w-16 mx-auto"></div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.screens.customers.title')}</h3>
                <p className="text-gray-600 font-medium mb-2">{t('landing.screens.customers.subtitle')}</p>
                <p className="text-sm text-gray-500">
                  {t('landing.screens.customers.description')}
                </p>
              </div>
            </div>

            {/* Screenshot 3 - Sales Tracking */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#fff0e6] to-[#ffe0cc] rounded-notion-card p-8 aspect-[4/3] flex items-center justify-center border border-[rgba(221,91,0,0.12)]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#dd5b00] rounded-2xl flex items-center justify-center mx-auto">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-red-300 rounded w-32 mx-auto"></div>
                    <div className="h-2 bg-red-200 rounded w-24 mx-auto"></div>
                    <div className="h-2 bg-red-200 rounded w-20 mx-auto"></div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.screens.sales.title')}</h3>
                <p className="text-gray-600 font-medium mb-2">{t('landing.screens.sales.subtitle')}</p>
                <p className="text-sm text-gray-500">
                  {t('landing.screens.sales.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[#f6f5f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="block">{t('landing.testimonials.titleTop')}</span>
              <span className="block text-2xl md:text-3xl text-gray-600 mt-2">
                {t('landing.testimonials.titleTop')}
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{t('landing.testimonials.items.ahmed.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('landing.testimonials.items.ahmed.name')}</p>
                    <p className="text-sm text-gray-500">{t('landing.testimonials.items.ahmed.role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{t('landing.testimonials.items.fatima.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('landing.testimonials.items.fatima.name')}</p>
                    <p className="text-sm text-gray-500">{t('landing.testimonials.items.fatima.role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{t('landing.testimonials.items.youssef.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('landing.testimonials.items.youssef.name')}</p>
                    <p className="text-sm text-gray-500">{t('landing.testimonials.items.youssef.role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0075de] to-[#213183]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                <span className="block">{t('landing.finalCta.titleTop')}</span>
                <span className="block text-2xl md:text-4xl mt-2">
                  {t('landing.finalCta.titleBottom')}
                </span>
              </h2>
                              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                {t('landing.finalCta.descTop')}
                <br />
                {t('landing.finalCta.descBottom')}
              </p>
            </div>

            {/* Signup Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('landing.finalCta.form.nameLabel')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('landing.finalCta.form.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/90 border-0 h-12 text-[rgba(0,0,0,0.95)] placeholder:text-[#a39e98]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t('landing.finalCta.form.phoneLabel')}
                    </label>
                    <Input
                      type="tel"
                      placeholder={t('landing.finalCta.form.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white/90 border-0 h-12 text-[rgba(0,0,0,0.95)] placeholder:text-[#a39e98]"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t('landing.finalCta.form.emailLabel')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('landing.finalCta.form.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/90 border-0 h-12 text-[rgba(0,0,0,0.95)] placeholder:text-[#a39e98]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-[#0075de] hover:bg-[#f6f5f4] font-bold py-4 text-lg rounded-notion-card shadow-notion-md hover:shadow-notion-lg transition-all duration-200"
                >
                  {t('landing.finalCta.form.submit')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-green-100 text-sm">
                  {t('landing.finalCta.form.haveAccount')}{' '}
                  <button
                    onClick={handleLogin}
                    className="text-white font-semibold underline hover:no-underline"
                  >
                    {t('landing.finalCta.form.loginLink')}
                  </button>
                </p>
              </div>
            </div>

            {/* Final Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t('landing.finalTrust.noHiddenFees')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t('landing.finalTrust.arabicSupport')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t('landing.finalTrust.multiDevice')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#31302e] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-[#0075de] rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{t('landing.brand')}</h3>
                <p className="text-sm text-gray-400">{t('landing.tagline')}</p>
              </div>
            </div>

            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.footer.descriptionTop')}
              <br />
              {t('landing.footer.descriptionBottom')}
            </p>

            <div className="border-t border-gray-800 pt-6">
              <p className="text-sm text-gray-500">
                {t('landing.footer.copyright')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
