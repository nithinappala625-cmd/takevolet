"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/list"); }, [router]);
  return null;
}
