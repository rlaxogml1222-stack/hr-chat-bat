
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatSession, Message, Role, Attachment, ModelType, KnowledgeEntry, UserLog, MasterActivity } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import { generateBizResponse } from './services/geminiService';

const HANS_DOC_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'hans_approval_common',
    content: `[전사 공통 결재 및 정산 원칙]
- 추가 품의: 최초 기안 대비 20% 이상 증액 또는 300만원 이상 차이 시 필수.
- 경비정산 절차: GW사전기안 -> 경비사용 -> ERP전표작성 -> GW결재상신.
- 출납 예정일: 지출 상신일로부터 2주 뒤 수요일 지급 (공휴일 시 익일 또는 전일 조정).`,
    timestamp: Date.now()
  },
  {
    id: 'hans_expense_rule_2025_update',
    content: `[법인카드 정산 증빙 강화 안내 (2025.12.23 시행)]
1. 시행일자: 2025년 12월 23일 결제분부터 즉시 시행
2. 주요 변경사항: 법인카드 정산 시 '매출전표'가 아닌 '상세내역(품목, 수량 등)'이 확인 가능한 '영수증' 첨부 필수.
3. 세부 지침:
   - 온라인 결제: 인보이스, 거래명세서, 결제확인 화면 캡처 등 상세내역 증빙 필수.
   - 해외 사용: 환율 차이가 있더라도 실제 내역 확인을 위해 영수증 반드시 첨부.
   - 영수증 분실 시: 불가피한 경우 매출전표로 대체 가능하나, 지출결의서 본문에 분실 사유 및 상세 사용내역을 반드시 기재해야 함.
4. 참고: 증빙 미비 시 결재 과정에서 소명 요청 또는 반려될 수 있음. (문의: 자금/기획팀)`,
    timestamp: Date.now()
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [masterActivities, setMasterActivities] = useState<MasterActivity[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  const [useSearch, setUseSearch] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [showMasterDashboard, setShowMasterDashboard] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('hb_auth_v3');
    const storedName = localStorage.getItem('hb_user_name');
    const storedId = localStorage.getItem('hb_employee_id');
    if (authStatus === 'true' && storedName && storedId) {
      setIsAuthenticated(true);
      setUserName(storedName);
      setEmployeeId(storedId);
    }

    const savedSessions = localStorage.getItem('hb_sessions');
    const savedKnowledge = localStorage.getItem('hb_knowledge');
    const savedLogs = localStorage.getItem('hb_user_logs');
    const savedMasterLogs = localStorage.getItem('hb_master_activity_logs');
    
    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    }
    
    if (savedKnowledge) {
      try {
        const parsedKnowledge = JSON.parse(savedKnowledge);
        const onlyUserKnowledge = parsedKnowledge.filter((k: any) => k.id.startsWith('user_'));
        setKnowledgeBase([...HANS_DOC_KNOWLEDGE, ...onlyUserKnowledge]);
      } catch (e) { setKnowledgeBase(HANS_DOC_KNOWLEDGE); }
    } else {
      setKnowledgeBase(HANS_DOC_KNOWLEDGE);
    }

    if (savedLogs) {
      try { setUserLogs(JSON.parse(savedLogs)); } catch (e) {}
    }

    if (savedMasterLogs) {
      try { setMasterActivities(JSON.parse(savedMasterLogs)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('hb_sessions', JSON.stringify(sessions));
      const userOnlyKnowledge = knowledgeBase.filter(k => k.id.startsWith('user_'));
      localStorage.setItem('hb_knowledge', JSON.stringify(userOnlyKnowledge));
      localStorage.setItem('hb_user_logs', JSON.stringify(userLogs));
      localStorage.setItem('hb_master_activity_logs', JSON.stringify(masterActivities));
    }
  }, [sessions, knowledgeBase, userLogs, masterActivities, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length >= 2 && employeeId.trim().length >= 2) {
      setIsAuthenticated(true);
      localStorage.setItem('hb_auth_v3', 'true');
      localStorage.setItem('hb_user_name', userName.trim());
      localStorage.setItem('hb_employee_id', employeeId.trim());
      
      const newLog: UserLog = { 
        id: Date.now().toString(), 
        name: userName.trim(), 
        employeeId: employeeId.trim(),
        timestamp: Date.now() 
      };
      setUserLogs([newLog, ...userLogs].slice(0, 100));
    } else {
      alert("성함과 사번을 정확히 입력해주세요.");
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setShowDeployGuide(false);
      setShowMasterDashboard(false);
    } else {
      const pw = prompt("관리자 비밀번호를 입력하세요.");
      if (pw === "hansadmin123") setIsAdmin(true);
      else alert("비밀번호가 틀렸습니다.");
    }
  };

  const handleSaveKnowledge = useCallback((content: string) => {
    const newEntry: KnowledgeEntry = {
      id: `user_${Date.now()}`,
      content: content.trim(),
      timestamp: Date.now()
    };
    setKnowledgeBase(prev => [newEntry, ...prev]);
    alert("사내 지식 베이스에 성공적으로 저장되었습니다.");
  }, []);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    let targetId = currentSessionId;
    if (!targetId) {
      targetId = Date.now().toString();
      const newSess = { id: targetId, title: text.slice(0, 20), messages: [], createdAt: Date.now() };
      setSessions([newSess, ...sessions]);
      setCurrentSessionId(targetId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, content: text, attachments, timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMsg] } : s));
    
    setIsLoading(true);
    try {
      const currentMessages = sessions.find(s => s.id === targetId)?.messages || [];
      const res = await generateBizResponse(text, [...currentMessages, userMsg], knowledgeBase, selectedModel, useSearch);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: Role.ASSISTANT, content: res.text, timestamp: Date.now(), groundingLinks: res.groundingChunks };
      
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, aiMsg] } : s));

      // 마스터 활동 로그 기록
      const activity: MasterActivity = {
        id: Date.now().toString(),
        userName: userName,
        employeeId: employeeId,
        userQuery: text,
        aiResponse: res.text,
        timestamp: Date.now(),
        usedSearch: useSearch
      };
      setMasterActivities(prev => [activity, ...prev].slice(0, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return masterActivities.filter(a => 
      a.userName.includes(dashboardSearch) || 
      a.employeeId.includes(dashboardSearch) || 
      a.userQuery.includes(dashboardSearch)
    );
  }, [masterActivities, dashboardSearch]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl w-full max-w-md border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/30">H</div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-slate-800 mb-2">임직원 인증</h1>
            <p className="text-sm text-slate-400 font-medium">서비스 이용을 위해 사번과 성함을 입력해주세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">사번 (Employee ID)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="사번 입력" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">성함 (Name)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)}
                  placeholder="성함 입력" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={userName.trim().length < 2 || employeeId.trim().length < 2}
              className={`w-full py-4 mt-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
                userName.trim().length < 2 || employeeId.trim().length < 2
                ? 'bg-slate-300 shadow-none cursor-not-allowed'
                : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'
              }`}
            >
              로그인
            </button>
          </form>
          
          <p className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed">
            본 서비스는 한스바이오메드 임직원 전용입니다.<br/>
            인가되지 않은 사용자의 접근은 금지됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar 
        sessions={sessions} knowledgeBase={knowledgeBase} userLogs={userLogs}
        currentSessionId={currentSessionId} isAdmin={isAdmin} userName={userName}
        onSelectSession={setCurrentSessionId}
        onNewChat={() => setCurrentSessionId(null)}
        onDeleteSession={id => setSessions(prev => prev.filter(s => s.id !== id))}
        onDeleteKnowledge={id => setKnowledgeBase(prev => prev.filter(k => k.id !== id))}
        onClearLogs={() => setUserLogs([])}
        onLogout={() => { localStorage.clear(); window.location.reload(); }}
        onToggleDeployGuide={() => setShowDeployGuide(!showDeployGuide)}
        onToggleMasterDashboard={() => setShowMasterDashboard(true)}
      />
      <main className="flex-1 flex flex-col relative">
        <ChatWindow 
          messages={sessions.find(s => s.id === currentSessionId)?.messages || []}
          isLoading={isLoading} model={selectedModel} useSearch={useSearch}
          isAdmin={isAdmin} userName={userName}
          onModelChange={setSelectedModel} onSearchToggle={() => setUseSearch(!useSearch)}
          onAdminToggle={handleAdminToggle} onSaveKnowledge={handleSaveKnowledge}
        />
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />

        {/* Master Dashboard Modal */}
        {showMasterDashboard && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                    마스터 대시보드 (전사 활동 로그)
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">임직원들의 모든 질문 및 AI 응답 내역을 실시간으로 확인합니다.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="이름, 사번, 질문 검색..." 
                      value={dashboardSearch}
                      onChange={e => setDashboardSearch(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button 
                    onClick={() => { if(confirm('모든 로그를 삭제하시겠습니까?')) setMasterActivities([]); }}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="로그 초기화"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button onClick={() => setShowMasterDashboard(false)} className="text-slate-400 hover:text-slate-600 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                {filteredActivities.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-lg">기록된 활동 로그가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredActivities.map(log => (
                      <div key={log.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-bold text-blue-600 text-lg">
                              {log.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-lg">{log.userName}</span>
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{log.employeeId}</span>
                                {log.usedSearch && (
                                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    검색 증강 사용
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">직원 질문</h4>
                            <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 leading-relaxed italic border border-slate-100">
                              "{log.userQuery}"
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">AI 응답 요약</h4>
                            <div className="p-4 bg-blue-50/30 rounded-2xl text-sm text-slate-600 leading-relaxed border border-blue-100/30 line-clamp-4">
                              {log.aiResponse}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-200 text-center">
                <button 
                  onClick={() => setShowMasterDashboard(false)}
                  className="px-10 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all"
                >
                  대시보드 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeployGuide && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">무료 배포 완료 가이드 (API Key 숨김)</h3>
                <button onClick={() => setShowDeployGuide(false)} className="text-slate-400">✕</button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-700 mb-2">핵심 컨셉</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    임직원들은 API 키를 알 필요가 없습니다. 관리자가 서버 설정에 딱 한 번만 키를 넣어두면, 직원들은 사이트 접속 시 이름만 쓰고 바로 무료 AI를 사용할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700">1단계: API 키 발급 (0원)</p>
                  <p className="text-xs text-slate-500">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 underline">Google AI Studio</a>에서 무료 Gemini API 키를 발급받으세요.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700">2단계: Netlify 배포 설정</p>
                  <p className="text-xs text-slate-500">Netlify 프로젝트의 <b>Site configuration &gt; Environment variables</b> 메뉴로 이동합니다.</p>
                  <div className="bg-slate-900 text-white p-3 rounded-xl font-mono text-xs mt-2 border border-slate-700">
                    Key: <span className="text-orange-400 font-bold">API_KEY</span><br/>
                    Value: <span className="text-green-400">AIzaSy... (발급받은 키)</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    3단계: 사이트 재배포 (필수!)
                  </p>
                  <p className="text-xs text-orange-600 leading-relaxed">
                    환경 변수를 저장한 후, **[Deploys]** 탭으로 이동하여 **[Trigger deploy] -> [Deploy site]**를 눌러야 설정값이 실제 웹사이트에 반영됩니다.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 text-center italic">이제 임직원들에게 배포된 URL만 공유하면 모든 세팅이 끝납니다.</p>
                </div>
              </div>
              
              <button onClick={() => setShowDeployGuide(false)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all">설정을 완료했습니다</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
