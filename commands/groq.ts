import Groq from "groq-sdk";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chatGPT(userMessage: string): Promise<string> {
  const chatCompletion = await getGroqChatCompletion(userMessage);
  // Print the completion returned by the LLM.

  return (
    chatCompletion.choices[0]?.message?.content?.trim() ||
    "Sorry, couldn't generate a response! 🤖"
  );
}

export async function VnTranscript(): Promise<string> {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream("./audio.m4a"),
    model: "whisper-large-v3",
    response_format: "verbose_json",
  });
  return transcription.text || "";
}

export async function getGroqChatCompletion(
  userMessage: string
): Promise<Groq.Chat.ChatCompletion> {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `${userMessage}`,
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}