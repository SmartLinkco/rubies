import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/AuthForms";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant} title="Sign in" tagline="Welcome back">
      <div className="px-4">
        <div className="rounded-card bg-white/85 p-5 shadow-soft ring-1 ring-black/[0.04]">
          <LoginForm />
        </div>
      </div>
    </AppShell>
  );
}
