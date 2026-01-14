
import React, { useState, useRef } from 'react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: base64
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 bg-white/50 backdrop-blur-md flex flex-col gap-2 max-w-4xl mx-auto w-full mb-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {attachments.map((att, i) => (
            <div key={i} className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-[11px] flex items-center gap-2 border border-blue-200">
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-white border border-slate-200 rounded-[28px] p-1.5 pr-2.5 shadow-sm focus-within:shadow-md transition-all">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력..."
          rows={1}
          className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 text-[14px] resize-none max-h-40"
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && attachments.length === 0) || isLoading}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            (!text.trim() && attachments.length === 0) || isLoading
            ? 'text-slate-300'
            : 'text-blue-500 hover:scale-110 active:scale-95'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 rotate-45" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InputArea;
