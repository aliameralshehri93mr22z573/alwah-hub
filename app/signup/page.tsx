import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { logAuthRouteError } from "@/lib/auth-page";

export default function SignupRedirectPage() {
  try {
    redirect("/register");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    logAuthRouteError("signup", error);
    redirect("/register");
  }
}
