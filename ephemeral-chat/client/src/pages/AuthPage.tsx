import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Atom } from "lucide-react";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useLogin();
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await login.mutateAsync({ username, password });
      } else {
        await register.mutateAsync({ username, email, password });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-panel w-full max-w-[480px] p-8 rounded-2xl z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 text-primary shadow-lg shadow-primary/20">
            <Atom className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground mt-2 text-center">
            {isLogin ? "We're so excited to see you again!" : "Create an account to join the quantum realm."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Email <span className="text-destructive">*</span></label>
              <Input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-input border-none h-12 focus-visible:ring-primary focus-visible:ring-2 transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Username <span className="text-destructive">*</span></label>
            <Input 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-input border-none h-12 focus-visible:ring-primary focus-visible:ring-2 transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Password <span className="text-destructive">*</span></label>
            <Input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-input border-none h-12 focus-visible:ring-primary focus-visible:ring-2 transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-12 font-bold text-[15px] bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all mt-6"
          >
            {isPending ? "Connecting..." : (isLogin ? "Log In" : "Register")}
          </Button>

          <div className="text-sm text-muted-foreground mt-4">
            {isLogin ? "Need an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-primary hover:underline font-semibold transition-colors"
            >
              {isLogin ? "Register" : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
