import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// Cache for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const maintenanceFilePath = path.join(process.cwd(), 'data', 'cms', 'maintenance.json');
    const fileContent = await fs.readFile(maintenanceFilePath, 'utf-8');
    const maintenanceData = JSON.parse(fileContent);
    
    return NextResponse.json(maintenanceData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Maintenance API error:', error);
    // Return default (not in maintenance mode)
    return NextResponse.json(
      { isInMaintenance: false },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
}
