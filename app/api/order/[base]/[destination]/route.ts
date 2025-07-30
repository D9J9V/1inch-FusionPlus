export async function POST(
  request: Request,
  { params }: { params: Promise<{ base: string; destination: string }> }
) {
  const { base, destination } = await params;
  
  return Response.json(
    { message: `Order created from ${base} to ${destination}` },
    { status: 200 }
  );
}