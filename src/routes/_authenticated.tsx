import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">
          Your account doesn't have admin access. Contact an existing admin.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
