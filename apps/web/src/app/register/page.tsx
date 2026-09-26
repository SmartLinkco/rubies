import { AppShell } from "@/components/AppShell";
import { RegisterForm } from "@/components/AuthForms";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant} title="Create account" tagline="Save addresses & orders">
      <div className="px-4">
        <div className="rounded-card bg-white/85 p-5 shadow-soft ring-1 ring-black/[0.04]">
          <RegisterForm />
        </div>
      </div>
    </AppShell>
  );
}
