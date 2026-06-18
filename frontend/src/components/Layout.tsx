import { Outlet } from "react-router-dom";
import { Toaster } from "@/lib/toast";

export function Layout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
