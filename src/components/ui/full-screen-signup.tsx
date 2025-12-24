import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Shield, Zap, ArrowLeft, Check, LayoutDashboard, Users, TrendingUp, AlertCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

// --- Schemas ---

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  countryCode: z.string().min(1, "Please select a country code"),
  phone: z.string().min(6, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service & Privacy Policy"
  })
});

const step2Schema = z.object({
  team_size: z.string().min(1, "Select team size"),
  business_type: z.string().min(1, "Select business type"),
  revenue_range: z.string().min(1, "Select revenue range"),
  pain_points: z.array(z.string()).min(1, "Select at least one pain point"),
  industry: z.string().min(1, "Select an industry")
});

// Combined type for final submission
type FullSignUpData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

const countryCodes = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
];

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201+"];
const REVENUE_RANGES = ["<$100k", "$100k - $500k", "$500k - $1M", "$1M+"];
const BUSINESS_TYPES = ["B2B", "B2C", "Hybrid", "Non-Profit"];
const PAIN_POINTS = [
  "Missed Calls",
  "High Staffing Costs",
  "Poor Support Quality",
  "After-Hours Coverage",
  "Lead Qualification",
  "Appointment Scheduling"
];
const INDUSTRIES = [
  "Real Estate", "Healthcare", "Legal", "E-commerce",
  "Technology", "Local Services", "Finance", "Other"
];

export const FullScreenSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState(countryCodes[0]);

  // Step 1 Form
  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { countryCode: countryCodes[0].code, acceptTerms: false }
  });

  // Step 2 Form
  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      pain_points: []
    }
  });

  // Watchers for dynamic UI
  const form1Values = form1.watch();
  const selectedPainPoints = form2.watch("pain_points");

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    // Just move to step 2, data is in form1 state
    setStep(2);
  };

  const onFinalSubmit = async (data2: z.infer<typeof step2Schema>) => {
    setIsLoading(true);
    const data1 = form1.getValues();

    // Combine data
    const fullData = { ...data1, ...data2 };

    try {
      const result = await signUp(fullData.name, fullData.email, fullData.password, {
        phone: fullData.phone,
        countryCode: fullData.countryCode,
        team_size: fullData.team_size,
        business_type: fullData.business_type,
        revenue_range: fullData.revenue_range,
        pain_points: fullData.pain_points,
        industry: fullData.industry
      });

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Welcome! Your dashboard is ready.",
        });
        // Post-signup navigation: Redirect to Customer Dashboard (usually /dashboard or /)
        navigate("/dashboard");
      } else {
        toast({
          title: "Sign up failed",
          description: result.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePainPoint = (point: string) => {
    const current = form2.getValues("pain_points");
    if (current.includes(point)) {
      form2.setValue("pain_points", current.filter(p => p !== point));
    } else {
      form2.setValue("pain_points", [...current, point]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-auto p-4 relative bg-slate-50">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50" />
      <div className="absolute inset-0 bg-[url('/src/assets/glass-bg.png')] bg-cover bg-center opacity-30 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Section - Branding */}
        <div className="hidden lg:flex flex-col space-y-8 text-left h-full justify-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              {step === 1 ? (
                <>
                  Start your journey with{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-600">
                    Shmixi
                  </span>
                </>
              ) : (
                <>
                  Tell us about{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-600">
                    Your Business
                  </span>
                </>
              )}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              {step === 1
                ? "Join thousands of businesses using AI to transform their customer communication."
                : "We'll customize your AI assistant based on your specific needs and goals."
              }
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6 pt-4">
            {step === 1 ? (
              <>
                <FeatureItem icon={Sparkles} title="AI-Powered Analytics" desc="Get real-time insights and analytics for all your calls" />
                <FeatureItem icon={Zap} title="Real-Time Monitoring" desc="Track performance and optimize your agent operations" />
                <FeatureItem icon={Shield} title="Enterprise Security" desc="Bank-level encryption and compliance standards" />
              </>
            ) : (
              <>
                <FeatureItem icon={LayoutDashboard} title="Custom Dashboard" desc="Tailored views for your business metrics" />
                <FeatureItem icon={Users} title="Team Integration" desc="Seamlessly onboard your team members" />
                <FeatureItem icon={TrendingUp} title="Goal Tracking" desc="Monitor progress towards your revenue targets" />
              </>
            )}
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full">
          <div className="w-full max-w-lg mx-auto backdrop-blur-xl bg-white/80 border border-white/50 rounded-3xl shadow-2xl p-8 relative overflow-hidden transition-all duration-500">

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
            </div>

            {/* Back Button (Step 2 Only) */}
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div className={`flex flex-col items-start mb-6 ${step === 2 ? "ml-8" : ""}`}>
              <h2 className="text-3xl font-bold mb-2 tracking-tight text-gray-900">
                {step === 1 ? "Create Account" : "Business Profile"}
              </h2>
              <p className="text-gray-500 text-sm">
                {step === 1 ? "Get started with Shmixi today" : "Help us tailor your experience"}
              </p>
            </div>

            {/* STEP 1 FORM */}
            {step === 1 && (
              <form className="flex flex-col gap-5" onSubmit={form1.handleSubmit(onStep1Submit)} noValidate>
                <div className="space-y-4">
                  <FormField label="Full Name" error={form1.formState.errors.name}>
                    <Input placeholder="John Doe" {...form1.register("name")} className="bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:text-gray-400" />
                  </FormField>

                  <FormField label="Email" error={form1.formState.errors.email}>
                    <Input type="email" placeholder="name@company.com" {...form1.register("email")} className="bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:text-gray-400" />
                  </FormField>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="flex gap-3">
                      <Select value={selectedCountry.code} onValueChange={(val) => {
                        const c = countryCodes.find(x => x.code === val);
                        if (c) { setSelectedCountry(c); form1.setValue("countryCode", val); }
                      }}>
                        <SelectTrigger className="w-28 bg-white border-gray-200"><SelectValue>{selectedCountry.flag}</SelectValue></SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {countryCodes.map((c, i) => (
                            <SelectItem key={i} value={c.code}>{c.flag} {c.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="tel" placeholder="Phone number" {...form1.register("phone")} className="flex-1 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:text-gray-400" />
                    </div>
                    {form1.formState.errors.phone && <p className="text-red-500 text-xs">{form1.formState.errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Strong password" {...form1.register("password")} className="pr-10 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder:text-gray-400" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form1.formState.errors.password && <p className="text-red-500 text-xs">{form1.formState.errors.password.message}</p>}
                  </div>

                  <div className="flex items-start space-x-3 pt-1">
                    <Checkbox
                      id="acceptTerms"
                      checked={form1.watch("acceptTerms")}
                      onCheckedChange={(c) => form1.setValue("acceptTerms", c as boolean)}
                      className="mt-1 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <Label htmlFor="acceptTerms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                      I agree to the <Link to="/terms" className="text-indigo-600 underline">Terms</Link> and <Link to="/privacy" className="text-indigo-600 underline">Privacy Policy</Link>
                    </Label>
                  </div>
                  {form1.formState.errors.acceptTerms && <p className="text-red-500 text-xs text-right">{form1.formState.errors.acceptTerms.message}</p>}
                </div>

                <Button type="submit" className="w-full mt-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-center text-gray-500 text-sm pt-2">
                  Already have an account? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
                </div>
              </form>
            )}

            {/* STEP 2 FORM */}
            {step === 2 && (
              <form className="flex flex-col gap-6" onSubmit={form2.handleSubmit(onFinalSubmit)}>

                {/* Team Size & User Role Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Team Size</Label>
                    <Select onValueChange={(v) => form2.setValue("team_size", v)}>
                      <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {TEAM_SIZES.map(s => <SelectItem key={s} value={s}>{s} members</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form2.formState.errors.team_size && <p className="text-red-500 text-xs">{form2.formState.errors.team_size.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Business Type</Label>
                    <Select onValueChange={(v) => form2.setValue("business_type", v)}>
                      <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {BUSINESS_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form2.formState.errors.business_type && <p className="text-red-500 text-xs">{form2.formState.errors.business_type.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Annual Revenue</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {REVENUE_RANGES.map(range => (
                      <div
                        key={range}
                        onClick={() => form2.setValue("revenue_range", range)}
                        className={`cursor-pointer px-3 py-2 rounded-lg border text-sm text-center transition-all ${form2.watch("revenue_range") === range ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                      >
                        {range}
                      </div>
                    ))}
                  </div>
                  {form2.formState.errors.revenue_range && <p className="text-red-500 text-xs">{form2.formState.errors.revenue_range.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Industry</Label>
                  <Select onValueChange={(v) => form2.setValue("industry", v)}>
                    <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {INDUSTRIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form2.formState.errors.industry && <p className="text-red-500 text-xs">{form2.formState.errors.industry.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary Pain Points <span className="text-xs text-gray-500 font-normal">(Select all that apply)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAIN_POINTS.map(point => {
                      const isSelected = selectedPainPoints?.includes(point);
                      return (
                        <div
                          key={point}
                          onClick={() => togglePainPoint(point)}
                          className={`cursor-pointer px-3 py-2 rounded-lg border text-xs text-center transition-all flex items-center justify-center gap-2 ${isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {point}
                        </div>
                      )
                    })}
                  </div>
                  {form2.formState.errors.pain_points && <p className="text-red-500 text-xs">{form2.formState.errors.pain_points.message}</p>}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white mt-2 shadow-lg shadow-indigo-200">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : "Complete Setup"}
                </Button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const FeatureItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-5 h-5 text-indigo-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  </div>
);

const FormField = ({ label, error, children }: { label: string, error?: any, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="text-destructive text-xs mt-1">{error.message}</p>}
  </div>
);