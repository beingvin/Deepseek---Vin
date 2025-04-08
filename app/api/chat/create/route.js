import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({
        successs: false,
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
    await connectDB();
    await Chat.create(ChatData);

    return NextResponse.json({ successs: true, message: "Chat created" });
  } catch (error) {
    return NextResponse.json({ successs: false, error: error.message });
  }
}
