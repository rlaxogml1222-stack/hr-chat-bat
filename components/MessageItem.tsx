
import React from 'react';
import { Message, Role } from '../types';

interface MessageItemProps {
  message: Message;
  isAdmin: boolean;
  onSaveKnowledge?: (content: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isAdmin, onSaveKnowledge }) => {
  const isUser = message.role === Role.USER;

  const parseInlines = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-700">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-red-500 font-mono text-[11px]">$1</code>');
  };

  const renderTable = (rows: string[], key: number) => {
    // 구분선(|---|) 제외
    const dataRows = rows.filter(row => !row.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/));
    if (dataRows.length === 0) return null;

    const headerParts = dataRows[0].split('|').filter(part => part.trim() !== '' || dataRows[0].startsWith('|') && part === '').map(p => p.trim()).filter((_, i, arr) => !(i === 0 && arr[0] === '') && !(i === arr.length - 1 && arr[arr.length-1] === ''));
    // 실제 표 데이터 파싱 (첫 줄은 제목으로 간주)
    const header = dataRows[0].split('|').map(s => s.trim()).filter(s => s !== '');
    const body = dataRows.slice(1).map(row => row.split('|').map(s => s.trim()).filter(s => s !== ''));

    return (
      <div key={`table-${key}`} className="table-container my-3">
        <table className="min-w-full">
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} dangerouslySetInnerHTML={{ __html: parseInlines(cell) }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} dangerouslySetInnerHTML={{ __html: parseInlines(cell) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      const isTableLine = trimmedLine.startsWith('|') && trimmedLine.includes('|', 1);

      if (isTableLine) {
        tableBuffer.push(trimmedLine);
      } else {
        if (tableBuffer.length > 0) {
          elements.push(renderTable(tableBuffer, i));
          tableBuffer = [];
        }
        
        if (trimmedLine === '') {
          elements.push(<div key={i} className="h-2" />);
        } else {
          elements.push(
            <p 
              key={i} 
              className="mb-1.5 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: parseInlines(line) }} 
            />
          );
        }
      }
    });

    if (tableBuffer.length > 0) {
      elements.push(renderTable(tableBuffer, lines.length));
    }

    return elements;
  };

  return (
    <div className={`flex w-full mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] lg:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div className={`relative px-4 py-3 shadow-sm transition-all group w-full ${
            isUser 
            ? 'bg-[#effdde] text-slate-800 rounded-2xl rounded-tr-none border border-[#c6e5a6]' 
            : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-200'
          }`}>
            <div className="text-[13.5px] markdown-body">
              {renderContent(message.content)}
            </div>

            {/* Save Knowledge Button - ONLY FOR ADMIN */}
            {!isUser && onSaveKnowledge && isAdmin && (
              <button 
                onClick={() => onSaveKnowledge(message.content)}
                className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-blue-500 transition-all text-slate-400"
                title="사내 지식으로 저장"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-slate-200/50 pt-2">
                {message.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded text-xs border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate font-medium">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`text-[10px] mt-1.5 flex justify-end ${isUser ? 'text-green-600' : 'text-slate-400'}`}>
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isUser && <span className="ml-1 font-bold">✓✓</span>}
            </div>
          </div>
          
          {!isUser && message.groundingLinks && message.groundingLinks.length > 0 && (
            <div className="mt-2 px-1 flex flex-col gap-1 w-full">
              {message.groundingLinks.map((link, idx) => (
                link.web && (
                  <a key={idx} href={link.web.uri} target="_blank" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1">
                    🔗 {link.web.title}
                  </a>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
