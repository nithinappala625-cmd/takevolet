import { redirect } from "next/navigation";

export default async function ShortDynamicPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  redirect(`/shorts?id=${encodeURIComponent(id)}`);
}
