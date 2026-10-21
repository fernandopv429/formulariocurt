import React, { useState } from 'react';
import { X, Check, Copy, Server, Zap, Terminal } from 'lucide-react';

interface CoolifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
}

export const CoolifyModal: React.FC<CoolifyModalProps> = ({ isOpen, onClose, webhookUrl }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleTestPing = async () => {
    setPingStatus('testing');
    setPingMessage('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teste Coolify & n8n',
          phone: '(11) 99999-9999',
          email: 'teste@exemplo.com.br',
          company: 'Nexus Hub Dev',
          utm: { source: 'coolify_diagnostics' },
          clientMetadata: { testRun: true },
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPingStatus('success');
        setPingMessage('Webhook testado com sucesso! O n8n recebeu a requisição.');
      } else {
        const directResp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Teste Direto',
            phone: '(11) 99999-9999',
            email: 'teste@exemplo.com.br',
            company: 'Nexus Hub Dev',
          }),
        });

        if (directResp.ok) {
          setPingStatus('success');
          setPingMessage('Webhook recebeu o teste com sucesso (via conexão direta)!');
        } else {
          setPingStatus('error');
          setPingMessage(data.error || 'Erro ao enviar teste para o webhook.');
        }
      }
    } catch (err: unknown) {
      setPingStatus('error');
      setPingMessage(err instanceof Error ? err.message : 'Falha ao testar webhook.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700 border border-violet-200">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pronto para o Coolify</h2>
              <p className="text-xs text-slate-500">Guia de implantação e conexão com o webhook n8n</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick status */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">Arquivos do Coolify configurados no projeto:</p>
              <ul className="mt-1 space-y-1 text-slate-700 text-xs list-disc list-inside">
                <li><code className="text-emerald-800 font-mono font-medium">Dockerfile</code> multi-stage (Node.js 22 + build Vite)</li>
                <li><code className="text-emerald-800 font-mono font-medium">docker-compose.yml</code> pronto para subida direta</li>
                <li><code className="text-emerald-800 font-mono font-medium">.dockerignore</code> para builds rápidos</li>
                <li>Porta interna: <strong className="text-slate-900">3000</strong> com healthcheck em <code className="text-emerald-800 font-mono font-medium">/api/health</code></li>
                <li>Proxy backend anti-CORS integrado em <code className="text-emerald-800 font-mono font-medium">/api/submit</code></li>
              </ul>
            </div>
          </div>

          {/* Webhook Info & Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Webhook de Destino (n8n)
              </label>
              <button
                onClick={() => handleCopy(webhookUrl, 'webhook')}
                className="text-xs text-violet-700 hover:text-violet-800 font-medium flex items-center gap-1 transition-colors"
              >
                {copiedSection === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'webhook' ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 break-all select-all">
              {webhookUrl}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pingStatus === 'testing'}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#FF4502] hover:bg-[#e03d00] disabled:opacity-50 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                {pingStatus === 'testing' ? 'Disparando teste...' : 'Enviar disparo de teste ao n8n'}
              </button>
            </div>

            {pingStatus === 'success' && (
              <p className="text-xs text-emerald-800 flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {pingMessage}
              </p>
            )}
            {pingStatus === 'error' && (
              <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {pingMessage}
              </p>
            )}
          </div>

          {/* Steps for Coolify */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-600" />
              Como publicar no seu Coolify (Passo a Passo)
            </h3>
            <ol className="space-y-2 text-xs text-slate-700">
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">1. No painel do Coolify:</strong>
                Vá em <em>Projects &rarr; + New Resource &rarr; Public/Private Git Repository</em> ou <em>Docker Compose</em>.
              </li>
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">2. Configuração de Build:</strong>
                Selecione <strong>Dockerfile</strong> (já detectado automaticamente) ou <strong>Docker Compose</strong>.
              </li>
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">3. Porta & Domínio:</strong>
                Porta exposta: <code className="text-violet-700 font-mono font-medium">3000</code>. Insira seu domínio ou subdomínio (ex: <code className="text-violet-700 font-mono font-medium">https://contato.suaempresa.com.br</code>).
              </li>
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">4. Variáveis de Ambiente (Opcional):</strong>
                Se quiser alterar o webhook no futuro:
                <div className="mt-1.5 p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 select-all">
                  N8N_WEBHOOK_URL={webhookUrl}
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
