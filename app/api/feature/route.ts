import connectDB from "@/config/database";
import FeatureModel from "@/models/featureModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  try {
    const data = await FeatureModel.findOne();
    console.log("feature data", data);
    return NextResponse.json(JSON.parse(JSON.stringify(data)));
  } catch (error) {
    return NextResponse.json({ msg: "GET", error });
  }
}
