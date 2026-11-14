import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/brand/Logo";
import { AuthLayout } from "@/layouts/AuthLayout";

function LoginPage() {
  return (
    <AuthLayout>
      <div className="animate-scale-in glass-panel rounded-2xl p-8 shadow-2xl shadow-navy-950/50 sm:p-10">
        <div className="animate-fade-in-up mb-8 flex flex-col items-center text-center [animation-delay:0.05s]">
          <Logo className="mb-5 h-11" />
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Please login to continue</p>
        </div>

        <div className="animate-fade-in-up [animation-delay:0.12s]">
          <LoginForm />
        </div>
      </div>
    </AuthLayout>
  );
}

export { LoginPage };
