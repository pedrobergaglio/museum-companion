import openai from "./client";
import fs from "fs/promises";
import path from "path";

export async function generateTts(
  text: string,
  projectId: number,
  messageId: number
): Promise<string> {
  const audioDir = path.join(process.cwd(), "data", "audio", String(projectId));

  await fs.mkdir(audioDir, { recursive: true });

  const fileName = `${messageId}.mp3`;
  const filePath = path.join(audioDir, fileName);

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/api/audio/${projectId}/${fileName}`;
}
