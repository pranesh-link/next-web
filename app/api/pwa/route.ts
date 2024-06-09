import connectDB from "@/config/database";
import PWAModel from "@/models/pwaModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  try {
    const data = await PWAModel.findOne();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ msg: "GET", error });
  }
}
