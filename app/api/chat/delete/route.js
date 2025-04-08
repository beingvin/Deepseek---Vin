import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatID } = await req.json();
    if (!userId) {
      return NextResponse.json({
        successs: false,
        message: "User not authenticated",
      });
    }

    // Connect to the database and delete the chat

    await connectDB();
    await Chat.deleteOne({ _id: chatID, userId });
    
    return NextResponse.json({ successs: true, message: "Chat Deleted" });
  } catch (error) {
    return NextResponse.json({ successs: false, error: error.message });
  }
}
