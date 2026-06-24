'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Lightbulb, Zap } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';
import { generateInsight, InsightContext } from '@/lib/insights';

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
    { role: 'assistant', content: "👋 Hi, I'm Maxbuy Insights — I read your live business data to answer questions.\n\nTry asking about:\n• 📦 What's low on stock / what to restock\n• 📊 Top categories by inventory value\n• 💰 Customer debt and how to reduce it\n• 📈 Profit margins and pricing\n• 📋 An overall business summary\n\nPick a prompt on the right or type your question below." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<InsightContext>({ products: [], dashboard: null });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-load live business data — insights are computed locally from it.
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

  function sendMessage(text?: string) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Compute the answer locally (no external API). Small delay for a natural feel.
    const reply = generateInsight(userText, context);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 300);
  }

  return (
    <>
      <Topbar title="AI Assistant" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Business Insights</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Smart insights computed locally from your live data — no setup or API key needed</p>
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
              <CardTitle icon={Zap}>How it works</CardTitle>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                These insights are generated on your device from your real inventory, sales and debt data — no external AI service or API key, and it works offline.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
