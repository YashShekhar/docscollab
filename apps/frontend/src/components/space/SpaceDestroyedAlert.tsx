"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bomb, Home, ArrowRight } from "lucide-react";

interface SpaceDestroyedAlertProps {
  destroyedBy?: string;
}

export function SpaceDestroyedAlert({ destroyedBy }: SpaceDestroyedAlertProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-red-500/50 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mb-5 shadow-inner">
          <Bomb className="h-8 w-8 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
          Space Destroyed
        </h2>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          This collaborative space was permanently destroyed by{" "}
          <span className="font-semibold text-red-600 dark:text-red-400">
            {destroyedBy || "a collaborator"}
          </span>
          .
        </p>

        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          All document contents have been wiped. Redirecting to home in{" "}
          <span className="font-bold text-zinc-700 dark:text-zinc-200">{countdown}s</span>...
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => router.push("/")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard Now
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
