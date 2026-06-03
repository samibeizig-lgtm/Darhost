'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

function MessagesInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const convIdParam = params.get('convId');

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = getUser();

  // Load conversations on mount and sync from Firebase
  useEffect(() => {
    const local = getConversations();
    if (currentUser) {
      const mine = local.filter(c => c.hostId === currentUser.id || c.guestId === currentUser.id);
      setConvs(mine);
      // Open conversation from URL param
      if (convIdParam) {
        const found = mine.find(c => c.id === convIdParam);
        if (found) {
          markConversationRead(convIdParam);
          setActiveId(convIdParam);
        }
      }
      // Sync from Firebase
      syncConversationsFromRemote(currentUser.id).then((synced) => {
        setConvs(synced);
        if (convIdParam && !activeId) {
          const found = synced.find(c => c.id === convIdParam);
          if (found) {
            markConversationRead(convIdParam);
            setActiveId(convIdParam);
          }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new messages every 6s when a conversation is open
  useEffect(() => {
    if (!activeId || !currentUser) return;
    pollRef.current = setInterval(async () => {
      const synced = await syncConversationsFromRemote(currentUser.id);
      setConvs(synced);
    }, 6000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, convs]);

  function participantOf(c: Conversation) {
    if (!currentUser) return { name: '', avatar: '' };
    const isHost = c.hostId === currentUser.id;
    return isHost
      ? { name: c.guestName, avatar: c.guestAvatar }
      : { name: c.hostName, avatar: c.hostAvatar };
  }

  const active = convs.find((c) => c.id === activeId) ?? null;

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
    const now = new Date();
    const timestamp = now.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      content: input.trim(),
      timestamp,
      isOwn: true,
    };
    const updated = addMessageToConversation(activeId, msg);
    if (updated) {
      setConvs(prev => prev.map(c => c.id === activeId ? updated : c));
    }
    setInput('');
  }

  const totalUnread = convs.reduce((sum, c) => sum + c.unread, 0);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('messages.title')}</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-[#0F4C8A] font-medium">
              {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0 ${
              active ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('messages.title') + '...'}
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
                    className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
                      activeId === conv.id ? 'bg-[#E8F0FB]' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
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

          {/* Chat panel */}
          {active ? (
            <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
              <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={participantOf(active).avatar}
                  alt={participantOf(active).name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{participantOf(active).name}</div>
                  {active.propertyTitle && (
                    <div className="text-xs text-[#0F4C8A] truncate">{active.propertyTitle}</div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(active.messages ?? []).length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {t('messages.no_messages_sub')}
                  </div>
                )}
                {(active.messages ?? []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.senderId !== currentUser.id && (
                      <img
                        src={participantOf(active).avatar}
                        alt={participantOf(active).name}
                        className="w-8 h-8 rounded-full object-cover mr-2 mt-1 shrink-0"
                      />
                    )}
                    <div className="max-w-xs sm:max-w-md">
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.senderId === currentUser.id
                            ? 'bg-[#0F4C8A] text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
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
