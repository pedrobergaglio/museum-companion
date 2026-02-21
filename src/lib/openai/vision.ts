import openai from "./client";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export async function* streamVisionResponse(params: {
  systemPrompt: string;
  imageBase64: string;
  question?: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): AsyncGenerator<string> {
  const { systemPrompt, imageBase64, question, conversationHistory } = params;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  // Agregar historial de conversacion (solo texto, ultimos 10 mensajes)
  for (const msg of conversationHistory.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Agregar el mensaje actual con imagen
  const userContent: Array<
    | { type: "image_url"; image_url: { url: string; detail: "low" } }
    | { type: "text"; text: string }
  > = [
    {
      type: "image_url",
      image_url: {
        url: `data:image/webp;base64,${imageBase64}`,
        detail: "low",
      },
    },
  ];

  if (question) {
    userContent.push({ type: "text", text: question });
  } else {
    userContent.push({
      type: "text",
      text: "Describí lo que ves en esta imagen. Si es una obra de arte, contá su historia, el artista y datos interesantes.",
    });
  }

  messages.push({ role: "user", content: userContent });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_tokens: 1000,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }

      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Error al conectar con OpenAI");
}

export async function* streamTextResponse(params: {
  systemPrompt: string;
  text: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): AsyncGenerator<string> {
  const { systemPrompt, text, conversationHistory } = params;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of conversationHistory.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: "user", content: text });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_tokens: 1000,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }

      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Error al conectar con OpenAI");
}
