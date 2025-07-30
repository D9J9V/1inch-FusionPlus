export default async function SwapPage({
  params
}: {
  params: Promise<{ 'base-network': string; 'destination-network': string }>
}) {
  const { 'base-network': baseNetwork, 'destination-network': destinationNetwork } = await params;
  
  return (
    <p>
      This page creates swaps from {baseNetwork} to {destinationNetwork}
    </p>
  )
}