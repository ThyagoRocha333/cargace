import { ChargeForm } from "@/components/charge-form";

export default async function EditChargePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChargeForm chargeId={id} />;
}
