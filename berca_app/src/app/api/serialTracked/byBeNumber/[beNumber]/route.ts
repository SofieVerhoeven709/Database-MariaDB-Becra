import { NextRequest, NextResponse } from 'next/server';
import { getSerialTrackedStructureByBeNumber } from '@/dal/materialSerialTrackedStructure';

// GET /api/serialTracked/byBeNumber/[beNumber]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ beNumber: string }> },
) {
  const { beNumber } = await params;

  if (!beNumber || beNumber.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid beNumber' }, { status: 400 });
  }

  try {
    const structure = await getSerialTrackedStructureByBeNumber(beNumber);
    if (!structure?.MaterialSerialTrack?.id) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, id: structure.MaterialSerialTrack.id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch serial tracked structure' }, { status: 500 });
  }
}
