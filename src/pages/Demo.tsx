import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setDemoMode } from "@/lib/integrations";

const Demo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Enable demo mode and redirect to onboarding
    setDemoMode(true);
    navigate('/onboarding', { replace: true });
  }, [navigate]);

  return null;
};

export default Demo;
