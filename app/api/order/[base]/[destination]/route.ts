import { ChainId, chains } from "@/types/chains";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ base: ChainId; destination: ChainId }> },
) {
  const { base, destination } = await params;

  if (!chains[base] || !chains[destination]) {
    return Response.json({ error: "Invalid chain selection" }, { status: 400 });
  }

  return Response.json(
    {
      message: `Order created from ${chains[base].name} to ${chains[destination].name}`,
    },
    { status: 200 },
  );
}
