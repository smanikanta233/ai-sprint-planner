import { useState } from "react";
import { Link, useLocation } from "wouter";
import { adminLogin } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError("");
    try {
      await adminLogin({ password });
      setLocation("/admin");
    } catch (err) {
      setError("Invalid administrative credentials");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border shadow-md rounded-lg overflow-hidden">
          <div className="p-8 text-center border-b border-border bg-muted/20">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Admin Access</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Authentication Key</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="bg-input border-border h-10"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded text-center">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider text-xs py-5"
              disabled={loading || !password}
            >
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
            </Button>
          </form>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">Not an Admin? Return to Planner</Link>
        </div>
      </div>
    </div>
  );
}