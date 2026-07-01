import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";

export default async function IndexPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/track");
  }
}
