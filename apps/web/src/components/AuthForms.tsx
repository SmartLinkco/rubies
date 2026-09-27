"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const resetOk = searchParams.get("reset") === "1";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await login(email, password);
      const next = safeNextPath(searchParams.get("next"));
      if (next) {
        router.push(next);
      } else if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not sign in. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />
      <p className="text-right text-sm">
        <Link href="/forgot-password" className="font-semibold text-rubies-blue">
          Forgot password?
        </Link>
      </p>
      {resetOk ? (
        <p className="rounded-2xl bg-[#E8F5EE] px-3 py-2 text-sm text-[#1B7A4A]">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-rubies-blue">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const { completeRegistration } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onStart(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await clientApi.registerStart({
        email,
        password,
        name: name || undefined,
        phone: phone || undefined,
      });
      setDevCode(data.devCode ?? null);
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not send verification code. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await completeRegistration(email, code);
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not verify code. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    setPending(true);
    setError(null);
    try {
      const data = await clientApi.registerResend({ email });
      setDevCode(data.devCode ?? null);
      setCode("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not resend code.",
      );
    } finally {
      setPending(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Check your email</p>
          <p className="mt-1 text-sm text-muted">
            We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
          </p>
        </div>
        <Field
          label="Verification code"
          value={code}
          onChange={setCode}
          autoComplete="one-time-code"
          inputMode="numeric"
          required
          hint="Enter the code from your inbox"
        />
        {devCode ? (
          <p className="rounded-2xl bg-cream px-3 py-2 text-xs text-muted">
            Dev mode (no Resend): use code <span className="font-semibold text-ink">{devCode}</span>
          </p>
        ) : null}
        {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify & create account"}
        </button>
        <div className="flex items-center justify-between gap-2 text-sm">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setStep("details");
              setCode("");
              setError(null);
            }}
            className="font-medium text-muted"
          >
            ← Edit details
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onResend()}
            className="font-semibold text-rubies-blue"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onStart} className="space-y-4">
      <Field label="Name" value={name} onChange={setName} autoComplete="name" />
      <Field
        label="Phone"
        value={phone}
        onChange={setPhone}
        autoComplete="tel"
        placeholder="027xxx"
      />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
        hint="At least 8 characters · we'll email a code to confirm"
      />
      {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending code…" : "Continue"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rubies-blue">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendForgot() {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const data = await clientApi.passwordForgot({ email });
      setDevCode(data.devCode ?? null);
      setInfo(data.message);
      setStep("reset");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not send reset code.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    await sendForgot();
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await clientApi.passwordReset({ email, code, password });
      router.push("/login?reset=1");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not reset password.",
      );
    } finally {
      setPending(false);
    }
  }

  if (step === "reset") {
    return (
      <form onSubmit={onReset} className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Enter your code</p>
          <p className="mt-1 text-sm text-muted">
            {info ?? `If ${email} is registered, we sent a code.`}
          </p>
        </div>
        <Field
          label="Reset code"
          value={code}
          onChange={setCode}
          autoComplete="one-time-code"
          inputMode="numeric"
          required
        />
        <Field
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          hint="At least 8 characters"
        />
        {devCode ? (
          <p className="rounded-2xl bg-cream px-3 py-2 text-xs text-muted">
            Dev mode (no Resend): use code <span className="font-semibold text-ink">{devCode}</span>
          </p>
        ) : null}
        {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void sendForgot()}
          className="w-full text-sm font-semibold text-rubies-blue"
        >
          Resend code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onForgot} className="space-y-4">
      <p className="text-sm text-muted">
        Enter your account email and we&apos;ll send a one-time code to reset your password.
      </p>
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset code"}
      </button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-rubies-blue">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  placeholder,
  hint,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-card border-0 bg-white px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-black/[0.05] placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
