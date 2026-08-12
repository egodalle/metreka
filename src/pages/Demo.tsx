import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setDemoMode } from "@/lib/integrations";
import { Loader2 } from "lucide-react";

/** Enables demo mode and opens the dashboard without requiring auth. */
const Demo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setDemoMode(true);
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Demo;
