import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");


  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Also check query params (some flows use query params)
        const token = searchParams.get("token");
        // const typeParam = searchParams.get("type");

        if (token) {
          // Handle token-based confirmation (our custom token system)
          try {
            // Verify using our custom endpoint
            const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/v1/user/verify-email?token=${token}`, {
              method: 'GET',
              redirect: 'follow'
            });

            if (response.ok) {
              setStatus("success");
              toast({
                title: "Email confirmed!",
                description: "Your email has been successfully verified.",
              });

              // Optional: Auto-login if response returns a token
              const data = await response.json();
              if (data.token) {
                localStorage.setItem('token', data.token);
                // Trigger auth refresh if needed
                window.location.href = '/dashboard'; // Force reload to pick up new auth state
                return;
              }

              // Otherwise redirect to login
              setTimeout(() => {
                navigate("/login");
              }, 2000);

            } else {
              throw new Error("Verification failed");
            }
          } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            throw tokenError;
          }
        } else {
          // No tokens found, might already be confirmed or invalid link
          setStatus("error");
          toast({
            title: "Invalid confirmation link",
            description: "This confirmation link is invalid or has expired.",
            variant: "destructive",
          });

          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setStatus("error");
        toast({
          title: "Confirmation failed",
          description: error?.message || "An error occurred while confirming your email.",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Confirming your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">Email confirmed successfully!</p>
            <p className="text-muted-foreground text-sm mt-2">Setting up your account...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">Confirmation failed</p>
            <p className="text-muted-foreground text-sm mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

