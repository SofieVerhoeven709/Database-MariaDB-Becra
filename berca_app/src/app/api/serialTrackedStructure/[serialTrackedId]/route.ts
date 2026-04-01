import { NextRequest, NextResponse } from 'next/server'
import { getSerialTrackedStructureBySerialTrackedId } from '@/dal/materialSerialTrackedStructure'

// GET /api/serialTrackedStructure/[serialTrackedId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ serialTrackedId: string }> }) {
  const { serialTrackedId } = await params;
  // Validate serialTrackedId is a non-empty string
  if (!serialTrackedId || serialTrackedId.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid serialTrackedId' }, { status: 400 });
  }
  try {
    const structure = await getSerialTrackedStructureBySerialTrackedId(serialTrackedId);
    return NextResponse.json(structure);
  } catch (error: any) {
    // Optionally log error here for debugging
    return NextResponse.json({ error: error?.message || 'Failed to fetch structure' }, { status: 500 });
  }
}

