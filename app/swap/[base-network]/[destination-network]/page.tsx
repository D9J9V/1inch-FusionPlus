import { chains, ChainId } from "../../../types/chains";

export default async function SwapPage({
  params,
}: {
  params: Promise<{ "base-network": ChainId; "destination-network": ChainId }>;
}) {
  const {
    "base-network": baseNetwork,
    "destination-network": destinationNetwork,
  } = await params;

  if (!chains[baseNetwork] || !chains[destinationNetwork]) {
    return <div>Invalid chain selection</div>;
  }

  return (
    <p>
      This page creates swaps from {chains[baseNetwork].name} to{" "}
      {chains[destinationNetwork].name}
    </p>
  );
}
