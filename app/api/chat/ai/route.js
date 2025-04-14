export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";

// --- Configuration ---
const GITHUB_PAT = process.env.GITHUB_DEEPSEEK_TOKEN;
const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com";
const DEEPSEEK_MODEL_DEPLOYMENT_NAME = "DeepSeek-V3-0324";

if (!GITHUB_PAT) {
  console.error("GITHUB_DEEPSEEK_TOKEN environment variable is not set.");
}

// Initialize the Azure AI Inference client (outside handler for potential reuse)
const client = ModelClient(GITHUB_MODELS_ENDPOINT, {
  allowInsecureConnection: true,
}); // Placeholder credential needed

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    //Extract chatId and prompt from the request body
    const { chatId, prompt, options } = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated",
      });
    }

    //Find the chat document in the database based on the userId and chatId
    await connectDB();
    const data = await Chat.findOne({ userId, _id: chatId });

    //Create a user message object
    const userPrompt = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    data.messages.push(userPrompt);

    // Call the GitHub AI Models API (DeepSeek) ---

    // Prepare message history for the AI (send previous context + new prompt)
    // IMPORTANT: You might need to limit the history length to avoid exceeding model token limits
    const messagesForApi = data.messages.map(({ role, content }) => ({
      role,
      content,
    }));
    // Potentially add logic here to truncate messagesForApi if too long
    const aiResponse = await client.path("/chat/completions").post({
      body: {
        messages: messagesForApi, // Send history + new user message
        temperature: options?.temperature ?? 0.8,
        top_p: options?.top_p ?? 0.9,
        max_tokens: options?.max_tokens ?? 2048,
        // model: DEEPSEEK_MODEL_DEPLOYMENT_NAME // Usually not needed in body if header is set
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_PAT}`,
        "x-ms-model-mesh-model-name": DEEPSEEK_MODEL_DEPLOYMENT_NAME,
      },
    });

    // --- 5. Handle AI Response ---
    if (isUnexpected(aiResponse)) {
      console.error(
        `GitHub AI Models API Error (${aiResponse.status}):`,
        aiResponse.body
      );
      const errorMessage =
        aiResponse.body?.error?.message || "Failed to call GitHub AI model";
      // Don't save the chat if AI failed
      return NextResponse.json(
        { error: errorMessage },
        { status: aiResponse.status }
      );
    }

    const aiMessageContent = aiResponse.body.choices?.[0]?.message?.content;

    const newAssistantMessage = {
      role: "assistant",
      content: aiMessageContent,
      timestamp: Date.now(),
    };

    data.messages.push(newAssistantMessage);
    await data.save();

    return NextResponse.json({ success: true, data: newAssistantMessage });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
