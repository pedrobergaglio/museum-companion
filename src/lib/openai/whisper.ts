import openai from "./client";
import { toFile } from "openai";

/**
 * Map common MIME types to file extensions and content types accepted by Whisper.
 */
function resolveAudioFormat(fileName: string): { name: string; type: string } {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".m4a")) {
    return { name: "audio.mp4", type: "audio/mp4" };
  }
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) {
    return { name: "audio.ogg", type: "audio/ogg" };
  }
  if (lower.endsWith(".mp3")) {
    return { name: "audio.mp3", type: "audio/mpeg" };
  }
  if (lower.endsWith(".wav")) {
    return { name: "audio.wav", type: "audio/wav" };
  }
  if (lower.endsWith(".flac")) {
    return { name: "audio.flac", type: "audio/flac" };
  }
  // Default to webm (Chrome/Firefox)
  return { name: "audio.webm", type: "audio/webm" };
}

/**
 * Transcribe audio using OpenAI Whisper API.
 * Accepts a Buffer of audio data (webm, mp3, wav, mp4, etc).
 * Returns the transcribed text in Spanish.
 */
export async function transcribeAudio(audioBuffer: Buffer, fileName = "audio.webm"): Promise<string> {
  const { name, type } = resolveAudioFormat(fileName);

  const file = await toFile(audioBuffer, name, { type });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "es",
  });

  return transcription.text;
}
