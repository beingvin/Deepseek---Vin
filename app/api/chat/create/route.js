import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated",
      });
    }
    //   Prepare the chat data to be saved in the database

    const ChatData = {
      userId,
      messages: [],
      name: "New Chat",
    };

    // Connect to the database and create a new chat
    const newChat = await Chat.create(ChatData);

    return NextResponse.json({ success: true, data: newChat });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
