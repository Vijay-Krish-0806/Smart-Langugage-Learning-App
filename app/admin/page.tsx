import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import AdminClient from "./client";
export default async function AdminPage() {
  // Check for admin access on the server
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }

  return (
    <>
      <AdminClient />
    </>
  );
}
