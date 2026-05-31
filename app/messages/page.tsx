'use client';

import { useState } from 'react';
import { Send, Search, ArrowLeft } from 'lucide-react';
import { conversations as initialConversations } from '@/lib/data';
import { Conversation } from '@/lib/types';

export default function MessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const active = convs.find((c) => c.id === activeId) ?? null;

  const filtered = convs.filter(
    (c) =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      (c.propertyTitle ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function selectConv(id: string) {
    setConvs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setActiveId(id);
  }

  function sendMessage() {
    if (!input.trim() || !activeId) return;
    const msg = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setConvs((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.content, lastTime: msg.timestamp }
          : c
      )
    );
    setInput('');
  }

  const totalUnread = convs.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-[#0F4C8A] font-medium">{totalUnread} non lu{totalUnread > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: '70vh' }}>
        <div className="flex h-full">
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
                  placeholder="Rechercher une conversation..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Aucune conversation trouvée
                </div>
              ) : (
                filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
                      activeId === conv.id ? 'bg-[#E8F0FB]' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.participantAvatar}
                        alt={conv.participantName}
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
                          {conv.participantName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{conv.lastTime}</span>
                      </div>
                      {conv.propertyTitle && (
                        <p className="text-xs text-[#0F4C8A] truncate mb-0.5">{conv.propertyTitle}</p>
                      )}
                      <p className={`text-sm truncate ${conv.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

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
                  src={active.participantAvatar}
                  alt={active.participantName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{active.participantName}</div>
                  {active.propertyTitle && (
                    <div className="text-xs text-[#0F4C8A] truncate">{active.propertyTitle}</div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.isOwn && (
                      <img
                        src={active.participantAvatar}
                        alt={active.participantName}
                        className="w-8 h-8 rounded-full object-cover mr-2 mt-1 shrink-0"
                      />
                    )}
                    <div className={`max-w-xs sm:max-w-md`}>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.isOwn
                            ? 'bg-[#0F4C8A] text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`text-xs text-gray-400 mt-1 ${msg.isOwn ? 'text-right' : 'text-left'}`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Envoyer un message à ${active.participantName.split(' ')[0]}...`}
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
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Vos messages</h3>
                <p className="text-gray-500 text-sm">
                  Sélectionnez une conversation pour commencer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
