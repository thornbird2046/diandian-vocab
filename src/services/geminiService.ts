import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Example {
  text: string;
  translation: string;
}

export interface Word {
  id: string;
  word: string;
  type: 'word' | 'phrase' | 'sentence';
  phonetic: string; // 音标
  phonics: string; // 自然拼读拆解，如 ap-ple
  pos: string; // 词性，如 noun 名词
  meaning: string; // 中文意思
  examples: Example[]; // 2个简单例句
  recordingUrl?: string; // 用户录音的URL (Base64)
  recordedAt?: number; // 录音时间戳
}

export interface Unit {
  id: string;
  name: string;
  words: Word[];
  wrongWordIds: string[]; // 记录拼写错误的单词ID
  createdAt: number;
}

export async function generateWordDetails(items: string[]): Promise<Word[]> {
  const prompt = `你是一个专业的小学英语老师。请为以下列表中的每一行生成详细的学习资料。

规则：
1. **一行一个单位**：每一行都是一个独立的学习单位（单词、词组或句子）。不要拆分。
2. **中英文识别**：如果行内包含中文（如 "apple 苹果"），请使用该中文作为 'meaning'。如果只有英文，请提供最适合小学生的标准翻译。
3. **类型判断**：判断是 'word'（单词）、'phrase'（词组）还是 'sentence'（句子）。
4. **词性标注 (POS)**：仅提供英文。格式要求：仅首字母大写，其余小写（如 "Noun", "Verb", "Adjective"）。不要包含中文。
5. **自然拼读 (Phonics)**：仅对 'word' 类型提供准确的音节拆解。对 'phrase' 和 'sentence' 类型返回空字符串 ""。请严格遵循 **牛津自然拼读 (Oxford Phonics World)** 的教学逻辑：
   - 保持字母组合（如 sh, ch, th, ck, ng, qu, ph, wh）不拆散。
   - 保持长元音组合（如 ai, ay, ee, ea, oa, oo, ie, igh）不拆散。
   - 保持 R 控制元音（如 ar, er, ir, or, ur）不拆散。
   - 保持双元音（如 ou, ow, oi, oy, au, aw）不拆散。
   - 保持辅音丛（如 bl, cl, fl, gl, pl, sl, br, cr, dr, fr, gr, pr, tr, sc, sk, sm, sn, sp, st, sw）在音节划分时尽量保持连贯。
   - 对于多音节词，在音节间用 '-' 拆分，但必须尊重上述发音单元。例如：'teacher' 拆分为 'tea-cher'，'chicken' 拆分为 'chick-en'，'flow-er'，'elephant' 拆分为 'el-e-phant'。
6. **音标 (Phonetic)**：对 'word' 和 'phrase' 提供标准的国际音标。
7. **例句**：对 'word' 和 'phrase' 提供 **2个** 简单且生动的例句。
   - 难度：符合小学 **四年级和五年级** 学生的理解能力。
   - 结构：句子结构简单，词汇常用。
   - 对 'sentence' 类型，例句为空数组。

列表内容：
${items.join("\n")}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "英文单词、词组或句子" },
            type: { type: Type.STRING, enum: ["word", "phrase", "sentence"] },
            phonetic: { type: Type.STRING },
            phonics: { type: Type.STRING },
            pos: { type: Type.STRING },
            meaning: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["text", "translation"]
              }
            }
          },
          required: ["word", "type", "phonetic", "phonics", "pos", "meaning", "examples"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function recognizeHandwriting(base64Image: string): Promise<string> {
  const prompt = "Recognize the English text in this handwriting image. Return ONLY the recognized text, nothing else. If it's a single word, return the word. If it's a sentence, return the full sentence. Accuracy is paramount.";
  
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Handwriting recognition failed", e);
    return "";
  }
}
