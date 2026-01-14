
import React, { useRef, useEffect } from 'react';
import { Message, ModelType } from '../types';
import MessageItem from './MessageItem';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  model: ModelType;
  useSearch: boolean;
  isAdmin: boolean;
  userName: string;
  onModelChange: (model: ModelType) => void;
  onSearchToggle: () => void;
  onAdminToggle: () => void;
  onSaveKnowledge: (content: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  isLoading, 
  model, 
  useSearch,
  isAdmin,
  userName,
  onModelChange,
  onSearchToggle,
  onAdminToggle,
  onSaveKnowledge
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 py-2.5 px-6 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm border border-blue-700 font-bold text-white overflow-hidden">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">한스바이오메드 업무용 챗봇</h2>
              {isAdmin && (
                <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-orange-200 uppercase tracking-tighter">Admin Mode</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-500">{userName}님 실시간 보안 연결 중</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Toggle */}
          <button 
            onClick={onAdminToggle} 
            className={`p-2 rounded-full transition-all border ${isAdmin ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
            title={isAdmin ? "관리자 모드 비활성화" : "관리자 모드 활성화"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button onClick={() => onModelChange(ModelType.FLASH)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${model === ModelType.FLASH ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>FLASH</button>
            <button onClick={() => onModelChange(ModelType.PRO)} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${model === ModelType.PRO ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>PRO</button>
          </div>
          <button onClick={onSearchToggle} className={`p-2 rounded-full transition-all border ${useSearch ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-100'}`} title="구글 검색 검색 증강">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-6 pb-4 px-2 md:px-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white shadow-sm">
              <span className="text-[11px] text-slate-600 font-medium">반갑습니다, {userName}님. 사내 규정이 반영된 챗봇입니다.</span>
            </div>
            <div className="max-w-md bg-white/90 p-10 rounded-[40px] border border-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500"></div>
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">HansBiomed BizBot</h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                한스바이오메드 임직원 전용 업무 어시스턴트입니다.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                복리후생, 경비 정산, 결재 라인 등 궁금한 사항을 아래에 입력해 주세요.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} isAdmin={isAdmin} onSaveKnowledge={onSaveKnowledge} />)
        )}

        {isLoading && (
          <div className="flex px-4 mb-4 gap-2">
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <div className="flex space-x-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                <span className="text-[11px] text-slate-400 ml-2 font-medium">응답 분석 중...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
