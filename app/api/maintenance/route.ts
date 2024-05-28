import connectDB from "@/config/database";
import MaintenanceModel from "@/models/maintenanceModel";
import { NextResponse } from "next/server";

export async function GET() {
  // const maintenance = await (
  //   await fetch(`${process.env.NEXT_PUBLIC_CMS_SERVER}/maintenance.json`, {
  //     mode: CORS_MODE,
  //     cache: "no-store",
  //   })
  // ).json();
  await connectDB();
  try {
    const data = await MaintenanceModel.findOne();
    return NextResponse.json(JSON.parse(JSON.stringify(data)));
  } catch (error) {
    return NextResponse.json({ msg: "GET", error });
  }
}
