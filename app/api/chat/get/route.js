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

    // Connect to the database and create a new chat
    await connectDB();
    const data = await Chat.find({ userId });

    return NextResponse.json({ successs: true, data });
  } catch (error) {
    return NextResponse.json({ successs: false, error: error.message });
  }
}
