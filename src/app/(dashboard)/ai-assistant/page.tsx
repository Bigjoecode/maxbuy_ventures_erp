'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Lightbulb, Zap } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string; }

const QUICK_PROMPTS = [
  'Which products are low on stock right now?',
  'What are my best-selling categories?',
  'How can I reduce customer debt risk?',
  'Give me tips to increase wholesale profit margins',
  'What should I restock before the weekend?',
  'Analyze my sales performance this month',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "👋 Welcome! I'm **Maxbuy AI**, your intelligent business assistant.\n\nI can help you with:\n• 📦 Inventory analysis and restock recommendations\n• 📈 Sales insights and trend analysis\n• 💰 Debt management and customer advice\n• 🎯 Business growth strategies\n\nWhat would you like to know about Maxbuy Ventures?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-load business context to inject into AI calls
    Promise.all([
      apiFetch<{ products: any[] }>('/api/products').catch(() => ({ products: [] })),
      apiFetch<any>('/api/dashboard').catch(() => null),
    ]).then(([{ products }, dash]) => {
      setContext({ products, dashboard: dash });
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build a rich system prompt from live business data
      const lowStock = context?.products?.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert) || [];
      const outOfStock = context?.products?.filter((p: any) => p.stockQuantity === 0) || [];
      const stats = context?.dashboard?.stats;

      const systemPrompt = `You are Maxbuy AI, the intelligent business assistant for Maxbuy Ventures — a growing grocery, baby feeds, and wholesale business based in Nigeria.

Current business snapshot:
- Today's revenue: ${stats ? formatCurrency(stats.todayRevenue) : 'unknown'}
- Today's sales count: ${stats?.todaySalesCount ?? 'unknown'}
- Total stock value: ${stats ? formatCurrency(stats.totalStockValue) : 'unknown'}  
- Total products: ${stats?.totalProducts ?? 'unknown'}
- Outstanding debts: ${stats ? formatCurrency(stats.outstandingDebts) : 'unknown'} from ${stats?.debtorsCount ?? 0} customers
- Low stock items (${lowStock.length}): ${lowStock.map((p: any) => p.name).slice(0, 5).join(', ') || 'none'}
- Out of stock items (${outOfStock.length}): ${outOfStock.map((p: any) => p.name).slice(0, 5).join(', ') || 'none'}

You are a knowledgeable business advisor with expertise in Nigerian retail and wholesale operations. Be concise, actionable, and use Nigerian context (Naira currency, local market conditions). Format responses clearly with bullet points when listing multiple items.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please check that the ANTHROPIC_API_KEY is configured in your .env file.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="AI Assistant" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">AI Business Assistant</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Powered by Claude — intelligent insights for Maxbuy Ventures</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="flex flex-col" style={{ minHeight: 500 }}>
            <CardTitle icon={Bot}>Ask Maxbuy AI</CardTitle>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 400 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm bg-[var(--green)] text-white' : 'rounded-bl-sm bg-[var(--green-light)] text-[var(--text)]'}`}>
                    {msg.content.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 rounded-xl rounded-bl-sm bg-[var(--green-light)] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ animationDelay: `${i * 0.15}s` }} className="h-1.5 w-1.5 rounded-full bg-[var(--green)] animate-bounce" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2 border-t border-[var(--border)] pt-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about sales, stock, insights..."
                className="flex-1 rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--green)]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--green)] text-white disabled:opacity-50 hover:bg-[var(--green-dark)]"
              >
                <Send size={14} />
              </button>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardTitle icon={Lightbulb}>Quick Prompts</CardTitle>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-[12px] font-medium text-[var(--text)] transition-all hover:border-[var(--green)] hover:bg-[var(--green-light)] hover:text-[var(--green)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle icon={Zap}>Setup Note</CardTitle>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                Add <code className="rounded bg-[var(--bg)] px-1 text-[11px]">ANTHROPIC_API_KEY</code> to your <code className="rounded bg-[var(--bg)] px-1 text-[11px]">.env</code> file to enable live AI responses. The AI uses your real business data as context.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
