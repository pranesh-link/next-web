import connectDB from "@/config/database";
import ConfigModel from "@/models/configModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  try {
    const data = await ConfigModel.findOne();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ msg: "GET", error });
  }
}
