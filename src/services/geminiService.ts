import OpenAI from "openai";

// 文字生成 + 图片识别，统一用一个客户端
const client = new OpenAI({
  apiKey: import.meta.env.VITE_QWEN_API_KEY || "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true
});

export interface Example {
  text: string;
  translation: string;
}

export interface Word {
  id: string;
  word: string;
  type: 'word' | 'phrase' | 'sentence';
  phonetic: string;
  phonics: string;
  pos: string;
  meaning: string;
  examples: Example[];
  recordingUrl?: string;
  recordedAt?: number;
}

export interface Unit {
  id: string;
  name: string;
  words: Word[];
  wrongWordIds: string[];
  createdAt: number;
}

export async function generateWordDetails(items: string[]): Promise<Word[]> {
  const prompt = `你是一个专业的小学英语老师。请为以下列表中的每一行生成详细的学习资料。

规则：
1. 一行一个单位：每一行都是一个独立的学习单位（单词、词组或句子）。不要拆分。
2. 中英文识别：如果行内包含中文（如 "apple 苹果"），请使用该中文作为 meaning。如果只有英文，请提供最适合小学生的标准翻译。
3. 类型判断：判断是 word（单词）、phrase（词组）还是 sentence（句子）。
4. 词性标注 POS：仅提供英文。格式：仅首字母大写（如 "Noun", "Verb", "Adjective"）。不要包含中文。
5. 自然拼读 Phonics：仅对 word 类型提供音节拆解，其他类型返回空字符串。遵循牛津自然拼读逻辑，用 - 分隔音节。例如：teacher → tea-cher，chicken → chick-en，elephant → el-e-phant。
6. 音标 Phonetic：对 word 和 phrase 提供国际音标。
7. 例句：对 word 和 phrase 提供 2 个简单例句，符合小学四五年级水平。sentence 类型例句为空数组。

严格按照 JSON 数组格式返回，不要有任何多余文字：
[{"word":"...","type":"word","phonetic":"...","phonics":"...","pos":"...","meaning":"...","examples":[{"text":"...","translation":"..."}]}]

列表内容：
${items.join("\n")}`;

  const response = await client.chat.completions.create({
    model: "qwen-turbo",
    messages: [{ role: "user", content: prompt }]
  });

  try {
    const content = response.choices[0].message.content || "[]";
    // 去掉可能的 markdown 代码块
    const clean = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    const arr = Array.isArray(data) ? data : (data.words || data.items || []);
    return arr.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    console.error("Failed to parse response", e);
    return [];
  }
}

export async function recognizeHandwriting(base64Image: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "qwen-vl-plus",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64Image }
            },
            {
              type: "text",
              text: "Recognize the English text in this handwriting image. Return ONLY the recognized text, nothing else. If it's a single word, return just the word. If it's a sentence, return the full sentence. Accuracy is paramount."
            }
          ]
        }
      ]
    });
    return response.choices[0].message.content?.trim() || "";
  } catch (e) {
    console.error("Handwriting recognition failed", e);
    return "";
  }
}
