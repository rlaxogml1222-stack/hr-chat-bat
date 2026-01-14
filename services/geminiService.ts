
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelType, KnowledgeEntry } from "../types";

export const generateBizResponse = async (
  prompt: string,
  history: Message[],
  knowledge: KnowledgeEntry[] = [],
  model: ModelType = ModelType.FLASH, // 기본값 Flash (무료 티어 최적화)
  useSearch: boolean = false
) => {
  // 환경변수에서 키를 가져옴. 배포 플랫폼(Vercel 등)에서 설정 필수.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API_KEY가 설정되지 않았습니다. 배포 환경의 환경변수를 확인하세요.");
    return {
      text: "현재 시스템 점검 중이거나 보안 연결(API Key)이 설정되지 않았습니다. 관리자에게 문의해 주세요.",
      groundingChunks: []
    };
  }

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
      model: model, // Flash 모델 사용 권장 (무료)
      contents,
      config,
    });

    const text = response.text || "응답을 생성할 수 없습니다.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      text,
      groundingChunks
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid")) {
      return { text: "설정된 API 키가 유효하지 않습니다. 관리자 설정을 확인하세요.", groundingChunks: [] };
    }
    throw error;
  }
};
