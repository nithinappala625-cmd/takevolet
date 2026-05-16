"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// Pages that should NOT show the site Navbar (they have their own headers)
const HIDDEN_ON = ["/admin", "/auth"];

export default function NavbarWrapper() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (hide) return null;
  return <Navbar />;
}
