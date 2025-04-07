// import { Webhook } from "svix";
// import connectDB from "@/config/db";
// import User from "@/models/User";
// import { headers } from "next/headers";
// import { NextRequest } from "next/server";

// export async function POST(req) {
//   const wh = new Webhook(process.env.SIGNING_SECRET);
//   const headerPayload = await headers();
//   const svixHeaders = {
//     "svix-id": headerPayload.get("svix-id"),
//     "svix-timestamp": headerPayload.get("svix-timestamp"),
//     "svix-signature": headerPayload.get("svix-signature"),
//   };

//   // Get the payload and verify it

//   const payload = await req.json();
//   const body = JSON.stringify(payload);
//   const { data, type } = wh.verify(body, svixHeaders);

//   // Prepare the user data to be saved in the database

//   const userData = {
//     _id: data.id,
//     email: data.email_addresses[0].email_address,
//     name: `${data.first_name} ${data.last_name}`,
//     image: data.image_url,
//   };
//   await connectDB();

  
//   switch (type) {
//     case "user.created":
//       await User.create(userData);
//       break;
//     case "user.updated":
//       await User.findByIdAndUpdate(data.id, userData);
//       break;
//     case "user.deleted":
//       await User.findByIdAndDelete(data.id);
//       break;
//     default:
//       break;
//   }
//   return NextRequest.json({ message: "Event received" });
// }

import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("Webhook received at /api/clerk");

    const wh = new Webhook(process.env.SIGNING_SECRET);
    const headerPayload = headers();
    const svixHeaders = {
      "svix-id": headerPayload.get("svix-id"),
      "svix-timestamp": headerPayload.get("svix-timestamp"),
      "svix-signature": headerPayload.get("svix-signature"),
    };

    console.log("Svix Headers:", svixHeaders);

    let body;

    try {
      body = JSON.stringify(await req.json());
      console.log("Raw Payload:", body);
    } catch (jsonError) {
      console.error("JSON Parsing Error:", jsonError);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { data, type } = wh.verify(body, svixHeaders);

    console.log("Verified Data:", data);
    console.log("Webhook Type:", type);

    // ... (rest of your code)
    //   // Prepare the user data to be saved in the database

  const userData = {
    _id: data.id,
    email: data.email_addresses[0].email_address,
    name: `${data.first_name} ${data.last_name}`,
    image: data.image_url,
  };
  await connectDB();

  
  switch (type) {
    case "user.created":
      await User.create(userData);
      break;
    case "user.updated":
      await User.findByIdAndUpdate(data.id, userData);
      break;
    case "user.deleted":
      await User.findByIdAndDelete(data.id);
      break;
    default:
      break;
  }
    return NextResponse.json({ message: "Event received" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
