import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
  });
  
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login.mutateAsync({
          username: formData.username,
          password: formData.password
        });
        setLocation("/"); // Redirect to chat
      } else {
        await signup.mutateAsync({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName || formData.username
        });
        toast({
          title: "Account created!",
          description: "You have been logged in automatically.",
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary z-0"></div>

      <div className="z-10 flex flex-col items-center gap-6 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-3 text-white">
          <MessageCircle className="h-10 w-10 fill-current" />
          <h1 className="text-2xl font-bold font-display tracking-tight">ChatApp</h1>
        </div>

        <Card className="w-full shadow-xl border-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Enter your credentials to access your chats" 
                : "Enter your details to get started"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium transition-transform active:scale-95"
                disabled={login.isPending || signup.isPending}
              >
                {login.isPending || signup.isPending 
                  ? "Processing..." 
                  : (isLogin ? "Sign In" : "Create Account")}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ username: "", password: "", displayName: "" });
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
