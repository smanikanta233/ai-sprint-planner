import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAuthToken, getAuthToken } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    if (getAuthToken()) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        setAuthToken(data.token);
        setLocation("/admin");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    loginMutation.mutate({ data: { password } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>
            Enter the administrative password to access settings and logs.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                required
                className="bg-background"
                data-testid="input-admin-password"
                autoFocus
              />
            </div>

            {loginMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>Invalid password or server error.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 pb-6">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending || !password}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Authenticate"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
