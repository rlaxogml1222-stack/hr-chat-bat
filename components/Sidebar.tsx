
import React from 'react';
import { ChatSession, KnowledgeEntry, UserLog } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  knowledgeBase: KnowledgeEntry[];
  userLogs: UserLog[];
  currentSessionId: string | null;
  isAdmin: boolean;
  userName: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onDeleteKnowledge: (id: string) => void;
  onClearLogs: () => void;
  onLogout: () => void;
  onToggleDeployGuide: () => void;
  onToggleMasterDashboard: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  knowledgeBase,
  userLogs,
  currentSessionId, 
  isAdmin,
  userName,
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  onDeleteKnowledge,
  onClearLogs,
  onLogout,
  onToggleDeployGuide,
  onToggleMasterDashboard
}) => {
  const privateKnowledge = knowledgeBase.filter(k => k.id.startsWith('user_'));

  return (
    <div className="w-80 bg-[#1c242f] h-full flex flex-col text-slate-300 overflow-hidden border-r border-slate-800">
      <div className="p-4 bg-[#242f3d] flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner overflow-hidden font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">HansBiomed</h1>
            <p className="text-[10px] text-blue-400 font-medium">{userName}님 접속 중</p>
          </div>
        </div>
        <button onClick={onNewChat} className="p-2 hover:bg-white/10 rounded-full transition-colors group" title="새 채팅 시작">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 관리자 전용 섹션 */}
        {isAdmin && (
          <div className="px-4 py-4 bg-orange-500/5 border-b border-orange-500/10 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  최근 접속 로그
                </h3>
                <button onClick={onClearLogs} className="text-[9px] text-orange-400/50 hover:text-orange-400">지우기</button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {userLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">로그가 없습니다.</p>
                ) : (
                  userLogs.map(log => (
                    <div key={log.id} className="flex flex-col gap-0.5 p-2 bg-[#1c242f] rounded border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200 text-[11px]">{log.name}</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[9px] text-blue-400/70 font-mono">ID: {log.employeeId}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={onToggleMasterDashboard}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 uppercase tracking-tighter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              마스터 대시보드 열기
            </button>
          </div>
        )}

        {/* 개인 지식 섹션 */}
        <div className="px-4 py-4 bg-[#17212b]/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              개인 지식 베이스
            </h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-mono">{privateKnowledge.length}</span>
          </div>
          <div className="space-y-1.5">
            {privateKnowledge.length === 0 ? (
              <p className="text-[11px] text-slate-600 italic px-1">저장된 정보가 없습니다.</p>
            ) : (
              privateKnowledge.map(k => (
                <div key={k.id} className="group flex items-start justify-between p-2.5 rounded-xl bg-[#242f3d] text-[11px] border border-slate-700/50 hover:border-blue-500/30 transition-all">
                  <span className="truncate flex-1 pr-2 leading-snug">{k.content}</span>
                  {isAdmin && (
                    <button onClick={() => onDeleteKnowledge(k.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 shrink-0 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">최근 업무 채팅</h3>
             <span className="text-[10px] text-slate-600 font-mono">{sessions.length}</span>
          </div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  currentSessionId === session.id ? 'bg-[#2b5278] text-white shadow-lg translate-x-1' : 'hover:bg-[#242f3d]'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                  {session.title.substring(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{session.title}</span>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {session.messages[session.messages.length - 1]?.content || '메시지 없음'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#17212b] border-t border-slate-800 space-y-2">
        {isAdmin && (
          <button 
            onClick={onToggleDeployGuide}
            className="w-full py-2 px-3 bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95"
          >
            임직원 배포 가이드
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-white/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          접속 종료
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
