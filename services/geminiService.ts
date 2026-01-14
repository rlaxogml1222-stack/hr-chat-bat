
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelType, KnowledgeEntry } from "../types";

export const generateBizResponse = async (
  prompt: string,
  history: Message[],
  knowledge: KnowledgeEntry[] = [],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
) => {
  // Fix: Directly use process.env.API_KEY as per @google/genai guidelines.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("API_KEY is missing.");
    return {
      text: "⚠️ **시스템 보안 연결(API Key) 설정이 완료되지 않았습니다.**\n\n**해결 방법:**\n1. Netlify 환경 변수에 `API_KEY`를 등록하셨나요?\n2. 등록 후 **[Deploys] -> [Trigger deploy] -> [Deploy site]**를 눌러 사이트를 다시 빌드하셨나요?\n\n위 절차를 완료해야 AI 기능이 활성화됩니다. 상세 내용은 우측 상단 자물쇠(관리자) -> '임직원 배포 가이드'를 확인하세요.",
      groundingChunks: []
    };
  }

  // Create a new instance right before making an API call to ensure it uses the most up-to-date key.
  const ai = new GoogleGenAI({ apiKey });
  
  const knowledgeContext = knowledge.length > 0 
    ? `\n\n### 한스바이오메드 사내 지식 베이스:\n${knowledge.map((k, i) => `${i+1}. ${k.content}`).join('\n\n')}`
    : "";

  const systemInstruction = `귀하는 '한스바이오메드(HansBiomed)'의 업무 지원 AI입니다. 
  사내 규정 및 가이드를 바탕으로 임직원에게 정확한 답변을 제공하십시오.
  항상 친절하고 전문적인 '하십시오체'를 사용하며, 복잡한 내용은 표(table)로 정리하십시오.
  [참조 데이터]${knowledgeContext}`;

  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [
      ...(msg.attachments || []).map(att => ({
        inlineData: {
          mimeType: att.type,
          data: att.data
        }
      })),
      { text: msg.content }
    ]
  }));

  const config: any = {
    systemInstruction,
    temperature: 0.1,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents,
      config,
    });

    // Fix: Access response.text directly (it is a getter, not a method).
    const text = response.text || "응답을 생성할 수 없습니다.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      text,
      groundingChunks
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate error for the caller to handle specific cases (like Requested entity was not found).
    throw error;
  }
};
