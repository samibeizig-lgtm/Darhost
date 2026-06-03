'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Send, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Conversation } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import {
  getUser,
  getConversations,
  addMessageToConversation,
  markConversationRead,
  syncConversationsFromRemote,
} from '@/lib/store';

function UserAvatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  const initial = (name || '?').charAt(0).toUpperCase();
  if (!src || broken) {
    return (
      <div className={`${sizeClass} rounded-full bg-[#0F4C8A] flex items-center justify-center shrink-0 font-bold text-white`}>
        {initial}
      </div>
    );
  }
  return (
    <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} onError={() => setBroken(true)} />
  );
}

function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => (b.lastMessageAt ?? b.createdAt ?? 0) - (a.lastMessageAt ?? a.createdAt ?? 0));
}

function MessagesInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const convIdParam = params.get('convId');

  const [currentUser] = useState(() => getUser());
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  // Ref on the messages container — scroll within it, never the page
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Load + sync on mount
  useEffect(() => {
    if (!currentUser) return;
    const local = sortByRecent(getConversations().filter(
      c => c.hostId === currentUser.id || c.guestId === currentUser.id
    ));
    setConvs(local);

    // On mobile don't auto-open — show the list. On desktop or with explicit convId, open.
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    const openId = convIdParam ?? (isDesktop ? local[0]?.id ?? null : null);
    if (openId) {
      markConversationRead(openId);
      setActiveId(openId);
    }

    syncConversationsFromRemote(currentUser.id).then((synced) => {
      setConvs(sortByRecent(synced));
      if (!convIdParam && !activeId && synced.length > 0 && isDesktop) {
        markConversationRead(synced[0].id);
        setActiveId(synced[0].id);
      } else if (convIdParam) {
        const found = synced.find(c => c.id === convIdParam);
        if (found) { markConversationRead(convIdParam); setActiveId(convIdParam); }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 6s when a conversation is open
  useEffect(() => {
    if (!activeId || !currentUser) return;
    pollRef.current = setInterval(() => {
      syncConversationsFromRemote(currentUser.id).then(s => setConvs(sortByRecent(s)));
    }, 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, currentUser]);

  // Scroll to bottom inside the chat container (NOT the page) when messages update
  useEffect(() => {
    scrollToBottom();
  }, [activeId, convs, scrollToBottom]);

  function participantOf(c: Conversation): { name: string; avatar: string } {
    if (!currentUser) return { name: '', avatar: '' };
    if (c.hostId === currentUser.id) return { name: c.guestName || '', avatar: c.guestAvatar || '' };
    return { name: c.hostName || '', avatar: c.hostAvatar || '' };
  }

  const active = convs.find((c) => c.id === activeId) ?? null;
  const activeParticipant = active ? participantOf(active) : null;

  const filtered = convs.filter((c) => {
    const p = participantOf(c);
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.propertyTitle ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  function selectConv(id: string) {
    markConversationRead(id);
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setActiveId(id);
  }

  function sendMessage() {
    if (!input.trim() || !activeId || !currentUser) return;
    const timestamp = new Date().toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      content: input.trim(),
      timestamp,
      isOwn: true,
    };
    const updated = addMessageToConversation(activeId, msg);
    if (updated) setConvs(prev => sortByRecent(prev.map(c => c.id === activeId ? updated : c)));
    setInput('');
    // Scroll after state update
    setTimeout(scrollToBottom, 50);
  }

  const totalUnread = convs.reduce((sum, c) => sum + (c.unread ?? 0), 0);

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('messages.no_messages')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('messages.title')}</h1>
        {totalUnread > 0 && (
          <p className="text-sm text-[#0F4C8A] font-medium">{totalUnread} non lu{totalUnread > 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: '70vh' }}>
        <div className="flex h-full">

          {/* ── Conversation list ── */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0 ${active ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
                  {t('messages.no_messages')}
                </div>
              ) : (
                filtered.map((conv) => {
                  const p = participantOf(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConv(conv.id)}
                      className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${activeId === conv.id ? 'bg-[#E8F0FB]' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <UserAvatar src={p.avatar} name={p.name} size="lg" />
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0F4C8A] text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm font-semibold truncate ${conv.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {p.name}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">{conv.lastTime}</span>
                        </div>
                        {conv.propertyTitle && (
                          <p className="text-xs text-[#0F4C8A] truncate mb-0.5">{conv.propertyTitle}</p>
                        )}
                        <p className={`text-sm truncate ${conv.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage || '…'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat panel ── */}
          {active && activeParticipant ? (
            <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
              <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 shrink-0">
                <button onClick={() => setActiveId(null)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <UserAvatar src={activeParticipant.avatar} name={activeParticipant.name} size="md" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{activeParticipant.name}</div>
                  {active.propertyTitle && (
                    <div className="text-xs text-[#0F4C8A] truncate">{active.propertyTitle}</div>
                  )}
                </div>
              </div>

              {/* Messages — scroll INSIDE this div only */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {(active.messages ?? []).length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {t('messages.no_messages_sub')}
                  </div>
                )}
                {(active.messages ?? []).map((msg) => {
                  const isOwn = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <UserAvatar src={activeParticipant.avatar} name={activeParticipant.name} size="sm" />
                      )}
                      <div className="max-w-xs sm:max-w-md">
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'bg-[#0F4C8A] text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border-t border-gray-200 p-4 shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={t('messages.type')}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-11 h-11 bg-[#0F4C8A] text-white rounded-full flex items-center justify-center hover:bg-[#0A3566] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('messages.title')}</h3>
                <p className="text-gray-400 text-sm">{t('messages.no_messages_sub')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
