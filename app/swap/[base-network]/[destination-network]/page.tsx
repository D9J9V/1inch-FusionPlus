export default function SwapPage({
  params
}: {
  params: { 'base-network': string; 'destination-network': string }
}) {
  return (
    <p>
      This page creates swaps from {params['base-network']} to {params['destination-network']}
    </p>
  )
}