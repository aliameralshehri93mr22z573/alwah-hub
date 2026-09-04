import { redirect } from "next/navigation";

type LegacyBoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyBoardRedirect({ params }: LegacyBoardPageProps) {
  const { id } = await params;
  redirect(`/dashboard/boards/${id}`);
}
