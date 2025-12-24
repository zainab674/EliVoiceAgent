import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/SupportAccessAuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('Starting sign in process...');
      const result = await signIn(data.email, data.password);
      console.log('Sign in result:', result);

      if (result.success) {
        console.log('Sign in successful, navigating...');

        // Clear any stale signup data (user is logging in, so they already have an account)
        localStorage.removeItem("signup-data");

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        navigate("/dashboard");
      } else {
        console.log('Sign in failed:', result.message);
        toast({
          title: "Sign in failed",
          description: result.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error?.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} Sign In`,
      description: "Social login not configured yet.",
    });
  };

  const handleForgotPassword = async () => {
    const email = watch("email");
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email above to receive a reset link." });
      return;
    }
    // Stub for now as backend doesn't support forgot password yet
    toast({
      title: "Contact Support",
      description: "Password reset is currently disabled. Please contact support to reset your password.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50" />
      <div className="absolute inset-0 bg-[url('/src/assets/glass-bg.png')] bg-cover bg-center opacity-30 pointer-events-none mix-blend-overlay" />

      {/* Animated Gradient Orbs - Lighter Colors */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />


      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col space-y-8 text-left">
            <div className="space-y-4">

              <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                Welcome back to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-600">
                  Shmixi
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Sign in to access your dashboard and continue managing your AI-powered platform.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Get real-time insights and analytics for all your calls
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Enterprise Security</h3>
                  <p className="text-sm text-gray-600">
                    Your data is protected with bank-level encryption
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Scalable Infrastructure</h3>
                  <p className="text-sm text-gray-600">
                    Built to scale with your business needs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 border border-white/50 shadow-2xl rounded-3xl">
              <CardHeader className="text-center space-y-3 pb-6">

                <CardTitle className="text-3xl font-bold text-gray-900">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-base text-gray-500">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">




                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        {...register("password")}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-gray-900 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe || false}
                        onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                        className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm text-gray-600 leading-none cursor-pointer"
                      >
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium transition-all shadow-lg shadow-indigo-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm pt-2">
                  <span className="text-gray-500">Don't have an account? </span>
                  <Link
                    to="/signup"
                    className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors"
                  >
                    Sign up for free
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}