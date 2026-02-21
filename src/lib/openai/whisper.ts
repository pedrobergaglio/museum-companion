import openai from "./client";
import { toFile } from "openai";

/**
 * Transcribe audio using OpenAI Whisper API.
 * Accepts a Buffer of audio data (webm, mp3, wav, etc).
 * Returns the transcribed text in Spanish.
 */
export async function transcribeAudio(audioBuffer: Buffer, fileName = "audio.webm"): Promise<string> {
  const file = await toFile(audioBuffer, fileName, {
    type: "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "es",
  });

  return transcription.text;
}
