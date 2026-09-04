import { amountMatchesPlan, parseGatewayPayload } from "@/lib/billing";
import { applyPaidPlan } from "@/lib/apply-billing";
import {
  BillingReturnView,
  BillingSuccessView,
} from "@/components/billing-success-view";
import { fetchMoyasarPayment } from "@/lib/moyasar";
import { paidPlanFrom } from "@/lib/checkout-session";

type SuccessPageProps = {
  searchParams: Promise<{
    payment_id?: string;
    id?: string;
    status?: string;
    message?: string;
    plan?: string;
    mock?: string;
  }>;
};

export const metadata = {
  title: "تم الدفع",
};

export default async function BillingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const query = await searchParams;
  const paymentId = query.payment_id || query.id || "";
  const statusHint = (query.status ?? "").toLowerCase();
  const mock =
    query.mock === "1" ||
    query.mock === "true" ||
    paymentId.startsWith("mock_");
  const mockPlan = paidPlanFrom(query.plan);

  if (mock && paymentId) {
    return (
      <BillingSuccessView
        plan={mockPlan}
        paymentId={paymentId}
        mock
      />
    );
  }

  if (!paymentId) {
    return (
      <BillingReturnView
        title="لا توجد عملية دفع"
        body="لم نجد معرّف العملية. إن كنت قد أتممت الدفع، عد من رسالة Moyasar أو من صفحة الأسعار."
        href="/pricing"
        action="العودة للأسعار"
      />
    );
  }

  if (statusHint && statusHint !== "paid" && statusHint !== "captured") {
    return (
      <BillingReturnView
        title="لم يكتمل الدفع"
        body={
          query.message ||
          "أُلغي التحويل أو لم يُعتمد. يمكنك المحاولة مرة أخرى من صفحة الأسعار."
        }
        href="/pricing"
        action="إعادة المحاولة"
      />
    );
  }

  const remote = await fetchMoyasarPayment(paymentId);
  const parsed = remote
    ? parseGatewayPayload({
        id: `payment:${remote.id}`,
        type: remote.status === "paid" ? "payment.paid" : `payment_${remote.status}`,
        data: remote,
      })
    : null;

  if (parsed?.paid && parsed.userId && parsed.plan && amountMatchesPlan(parsed.plan, parsed.amountHalalas)) {
    await applyPaidPlan(parsed, remote);
    return (
      <BillingSuccessView
        plan={paidPlanFrom(parsed.plan)}
        paymentId={parsed.paymentId}
      />
    );
  }

  if (remote && remote.status !== "paid" && remote.status !== "captured") {
    return (
      <BillingReturnView
        title="بانتظار تأكيد الدفع"
        body="العملية وصلت لكن حالتها ليست مدفوعة بعد. إن اكتمل 3D Secure ستُفعَّل الباقة عبر الويب هوك خلال لحظات."
        href="/dashboard"
        action="العودة إلى لوحة التحكم"
      />
    );
  }

  const fallbackPlan = paidPlanFrom(String(remote?.metadata?.plan ?? ""));
  return <BillingSuccessView plan={fallbackPlan} paymentId={paymentId} />;
}
