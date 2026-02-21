"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
import type { User } from "@/types";

const USER_ICONS = ["🧑", "👩", "🧑‍🦱", "👧", "🧔"];

export default function SelectUserPage() {
  const router = useRouter();
  const { setCurrentUser } = useUserStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success) {
          setUsers(json.data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  function handleSelectUser(user: User) {
    setCurrentUser(user);
    router.push("/");
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Museum Companion
        </h1>
        <p className="mt-2 text-muted-foreground">
          Seleccioná tu nombre para empezar
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : (
          users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="flex h-14 items-center gap-4 rounded-lg border border-border bg-card px-5 text-lg font-medium text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
            >
              <span className="text-2xl">{USER_ICONS[index] || "👤"}</span>
              {user.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
