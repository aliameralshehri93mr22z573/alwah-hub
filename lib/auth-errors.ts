const AUTH_ERROR_MAP: Array<[string, string]> = [
  ["Invalid login credentials", "بيانات الدخول غير صحيحة."],
  ["Email not confirmed", "يرجى تأكيد البريد الإلكتروني أولاً."],
  ["User already registered", "هذا البريد مسجّل مسبقاً."],
  ["Signup requires a valid password", "كلمة المرور غير صالحة."],
  ["Password should be at least", "كلمة المرور يجب أن تكون 6 أحرف على الأقل."],
  ["Unable to validate email address", "البريد الإلكتروني غير صالح."],
  ["Email rate limit exceeded", "تجاوزت حد إرسال الرسائل. حاول بعد قليل."],
  ["For security purposes", "لأسباب أمنية، انتظر لحظات ثم أعد المحاولة."],
  ["otp_expired", "انتهت صلاحية رابط الدخول. اطلب رابطاً جديداً."],
  ["access_denied", "تم رفض الوصول. حاول تسجيل الدخول مجدداً."],
  ["Missing NEXT_PUBLIC_SUPABASE", "لم يُضبط اتصال Supabase بعد."],
];

export function toArabicAuthError(message: string) {
  const match = AUTH_ERROR_MAP.find(([needle]) =>
    message.toLowerCase().includes(needle.toLowerCase()),
  );
  return match?.[1] ?? "تعذر إكمال العملية الآن. حاول مرة أخرى.";
}
