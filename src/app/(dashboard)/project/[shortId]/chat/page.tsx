'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hola! Soy Kiyoko AI. En que puedo ayudarte con este proyecto?',
};

const QUICK_SUGGESTIONS = [
  'Mejorar una escena',
  'Anadir personaje',
  'Analizar narrativa',
];

export default function ChatPage() {
  const params = useParams();
  const projectId = params.slug as string;

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading || !projectId) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          messages: updatedMessages.filter((m) => m !== INITIAL_MESSAGE),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              fullText += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: fullText,
                };
                return updated;
              });
            }
            if (data.error) {
              fullText += `\n[Error: ${data.error}]`;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: fullText,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Chat IA</h2>
        <p className="text-sm text-muted-foreground">
          Conversa con la IA sobre tu proyecto
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-card p-4">
        {messages.length === 1 && messages[0] === INITIAL_MESSAGE ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              {INITIAL_MESSAGE.content}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {message.content || (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
