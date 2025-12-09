"use client";

import { useEffect } from "react";

export default function CheckDemoClubAdmin() {
  useEffect(() => {
    // Check if this is demo club and set admin_session if needed
    fetch("/api/check-demo-club-admin", {
      method: "POST",
      credentials: "include",
    }).catch((error) => {
      console.error("Error checking demo club admin:", error);
    });
  }, []);

  return null; // This component doesn't render anything
}
