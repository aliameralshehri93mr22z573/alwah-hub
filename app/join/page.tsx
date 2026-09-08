import { AuthShell } from "@/components/auth-shell";
import { JoinClient } from "@/app/join/join-client";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const inviteToken = token?.trim() ?? "";

  return (
    <AuthShell
      title="الانضمام إلى مساحة العمل"
      subtitle="نفعّل دخولك تلقائياً من رابط الدعوة، ثم ننقلك إلى لوحة المهام."
    >
      {inviteToken ? (
        <JoinClient token={inviteToken} />
      ) : (
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          رابط الدعوة غير مكتمل. اطلب رابطاً جديداً من مدير المساحة.
        </p>
      )}
    </AuthShell>
  );
}
