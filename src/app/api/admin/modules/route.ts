import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Kill-switches live only on the hidden TECH surface. Do not advertise /ops here. */
export async function GET() {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}
