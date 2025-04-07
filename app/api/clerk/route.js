import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req) {
  const wh = new Webhook(process.env.SIGNING_SECRET);
  const headerPayload = await headers();
  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id"),
    "svix-timestamp": headerPayload.get("svix-timestamp"),
    "svix-signature": headerPayload.get("svix-signature"),
  };

  // Get the payload and verify it

  let body;
  try {
    const payload = await req.json();
    body = JSON.stringify(payload);
    console.log("Raw Payload:", body);
  } catch (jsonError) {
    console.error("JSON Parsing Error:", jsonError);
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { data, type } = wh.verify(body, svixHeaders);

  // Prepare the user data to be saved in the database

  console.log({ "payload data": data });

 // Prepare the user data to be saved in the database
 
 let userData; // Declare userData

 if (type !== "user.deleted") {
     const userEmail = data.email_addresses?.[0]?.email_address || null;
     userData = {
       _id: data.id,
       email: userEmail,
       name: `${data.first_name} ${data.last_name}`,
       image: data.image_url,
     };
   } else {
     userData = {
       _id: data.id,
     };
   }
 
  await connectDB();

  switch (type) {
    case "user.created":
      await User.create(userData);
      break;
    case "user.updated":
      await User.findByIdAndUpdate(data.id, userData);
      break;
    case "user.deleted":
      console.log(data.id);
      await User.findByIdAndDelete(data.id);
      break;
    default:
      break;
  }
  return NextRequest.json({ message: "Event received" });
}
