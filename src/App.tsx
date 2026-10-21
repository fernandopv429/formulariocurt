/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  User,
  Phone,
  Mail,
  Building2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  formatBrazilianPhone,
  isValidEmail,
  isValidPhone,
  getUtmParameters,
  getClientMetadata,
} from './utils/formatters.ts';

const N8N_WEBHOOK_URL =
  'https://n8n.nexusdevhub.com/webhook/4d5aa228-e370-428b-9a9e-0148abb02e51';

interface FormData {
  name: string;
  phone: string;
  email: string;
  company: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
}

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    company: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs para navegação suave por tecla Enter
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Informe seu nome completo.';
        if (value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Informe seu telefone ou WhatsApp.';
        if (!isValidPhone(value)) return 'Informe um telefone com DDD válido.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Informe seu e-mail.';
        if (!isValidEmail(value)) return 'Informe um e-mail válido.';
        return undefined;
      case 'company':
        if (!value.trim()) return 'Informe o nome da sua empresa.';
        if (value.trim().length < 2) return 'Nome da empresa muito curto.';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (field: keyof FormData, rawValue: string) => {
    let value = rawValue;
    if (field === 'phone') {
      value = formatBrazilianPhone(rawValue);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      phone: true,
      email: true,
      company: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      company: formData.company.trim(),
      submittedAt: new Date().toISOString(),
      utm: getUtmParameters(),
      clientMetadata: getClientMetadata(),
    };

    try {
      let response: Response;
      let usedDirectFallback = false;

      try {
        response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        usedDirectFallback = true;
        response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok && !usedDirectFallback) {
        try {
          const directFallback = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (directFallback.ok) {
            response = directFallback;
          }
        } catch {
          // ignore
        }
      }

      if (response.ok) {
        setSubmitStatus('success');
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Falha no envio (Status: ${response.status})`
        );
      }
    } catch (err: unknown) {
      console.error('Erro na submissão:', err);
      setSubmitStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar ao webhook. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
    });
    setErrors({});
    setTouched({});
    setSubmitStatus('idle');
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm mx-auto">
        {/* Cabeçalho do formulário */}
        <div className="mb-6 text-center">
          <p className="text-xs font-black tracking-widest uppercase text-[#FF4502] mb-1">
            O QUE OS NÚMEROS DIZEM
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Preencha para receber o pacote gratuito
          </h1>
        </div>

        {submitStatus === 'success' ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Recebemos seus dados!
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Seu pacote gratuito será liberado em instantes.
            </p>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#FF4502] hover:bg-[#e03d00] active:scale-[0.98] text-white font-bold text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Enviar outra resposta</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {submitStatus === 'error' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Campo 1: Nome */}
            <div className="space-y-1">
              <label
                htmlFor="field-name"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Nome <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="field-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      phoneInputRef.current?.focus();
                    }
                  }}
                  className={`w-full h-12 pl-10 pr-3.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    touched.name && errors.name
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-300 hover:border-slate-400 focus:border-[#FF4502] focus:ring-4 focus:ring-[#FF4502]/10'
                  }`}
                />
              </div>
              {touched.name && errors.name && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{errors.name}</p>
              )}
            </div>

            {/* Campo 2: Telefone */}
            <div className="space-y-1">
              <label
                htmlFor="field-phone"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Telefone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  ref={phoneInputRef}
                  id="field-phone"
                  type="tel"
                  inputMode="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      emailInputRef.current?.focus();
                    }
                  }}
                  className={`w-full h-12 pl-10 pr-3.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    touched.phone && errors.phone
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-300 hover:border-slate-400 focus:border-[#FF4502] focus:ring-4 focus:ring-[#FF4502]/10'
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{errors.phone}</p>
              )}
            </div>

            {/* Campo 3: E-mail */}
            <div className="space-y-1">
              <label
                htmlFor="field-email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                E-mail <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  ref={emailInputRef}
                  id="field-email"
                  type="email"
                  inputMode="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      companyInputRef.current?.focus();
                    }
                  }}
                  className={`w-full h-12 pl-10 pr-3.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    touched.email && errors.email
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-300 hover:border-slate-400 focus:border-[#FF4502] focus:ring-4 focus:ring-[#FF4502]/10'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{errors.email}</p>
              )}
            </div>

            {/* Campo 4: Nome da Empresa */}
            <div className="space-y-1">
              <label
                htmlFor="field-company"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Nome da Empresa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  ref={companyInputRef}
                  id="field-company"
                  type="text"
                  name="company"
                  autoComplete="organization"
                  required
                  placeholder="Nome da sua empresa"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  onBlur={() => handleBlur('company')}
                  className={`w-full h-12 pl-10 pr-3.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                    touched.company && errors.company
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-300 hover:border-slate-400 focus:border-[#FF4502] focus:ring-4 focus:ring-[#FF4502]/10'
                  }`}
                />
              </div>
              {touched.company && errors.company && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{errors.company}</p>
              )}
            </div>

            {/* Botão de envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-xl bg-[#FF4502] hover:bg-[#e03d00] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none text-white font-extrabold text-sm tracking-wide transition-all shadow-md shadow-[#FF4502]/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>RECEBER PACOTE GRATUITO</span>
                    <Send className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seus dados são 100% seguros e confidenciais.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
