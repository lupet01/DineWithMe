import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="text-sm text-slate-600">
          Join DineWithMe and start connecting over meals
        </p>
      </div>

      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-white shadow-xl shadow-slate-200/50 rounded-2xl border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl font-medium",
            socialButtonsBlockButtonText: "font-medium text-sm",
            dividerLine: "bg-slate-200",
            dividerText: "text-slate-500 text-xs",
            formButtonPrimary:
              "bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors shadow-sm",
            formFieldInput:
              "rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400",
            formFieldLabel: "text-slate-700 font-medium text-sm",
            footerActionLink: "text-slate-900 hover:text-slate-700 font-medium",
            identityPreviewText: "text-slate-700",
            identityPreviewEditButton: "text-slate-600 hover:text-slate-900",
            formResendCodeLink: "text-slate-600 hover:text-slate-900",
            otpCodeFieldInput:
              "border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg",
          },
        }}
      />
    </div>
  );
}
