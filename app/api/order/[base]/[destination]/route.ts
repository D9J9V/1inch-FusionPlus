export async function POST(
  request: Request,
  { params }: { params: { base: string; destination: string } }
) {
  const { base, destination } = params;
  
  return Response.json(
    { message: `Order created from ${base} to ${destination}` },
    { status: 200 }
  );
}