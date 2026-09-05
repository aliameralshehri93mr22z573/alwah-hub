const PHRASES: Record<string, string> = {
  "عرض سعر لشركة النور": "Quote for Al-Noor Company",
  "مهمة تجريبية لحقول قالب العمل والمبيعات.":
    "A sample task for the sales template fields.",
  "متابعة عميل الاحساء": "Follow up with the Al-Ahsa client",
  "اتصال ثانٍ بعد إرسال العرض.": "Second call after sending the quote.",
  "تفاوض على الخصم": "Negotiate the discount",
  "انتظار موافقة الإدارة المالية.": "Waiting for finance approval.",
  "مهمة جديدة": "New task",
  "أرسلت العرض للعميل.": "I sent the quote to the client.",
  "ننتظر الرد قبل نهاية الأسبوع.": "We are waiting for a reply before the weekend.",
  "عرض السعر.pdf": "Quote.pdf",
};

export function mockTranslate(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }
  return PHRASES[trimmed] ?? text;
}

export function hasMockTranslation(text: string): boolean {
  return Boolean(PHRASES[text.trim()]);
}
