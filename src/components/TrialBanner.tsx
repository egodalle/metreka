import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHasAccess } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { isTrialing, daysLeftInTrial } = useHasAccess();
  const navigate = useNavigate();

  if (!isTrialing) return null;

  const urgencyColor = daysLeftInTrial <= 2 
    ? "from-destructive/20 to-destructive/10 border-destructive/30" 
    : "from-accent/20 to-accent/10 border-accent/30";

  const textColor = daysLeftInTrial <= 2 ? "text-destructive" : "text-accent";

  return (
    <div className={`w-full bg-gradient-to-r ${urgencyColor} border-b px-4 py-2`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${textColor}`} />
          <span className="text-sm font-medium">
            {daysLeftInTrial === 0 ? (
              <span className={textColor}>Your trial ends today!</span>
            ) : daysLeftInTrial === 1 ? (
              <span className={textColor}>1 day left in your free trial</span>
            ) : (
              <span>{daysLeftInTrial} days left in your free trial</span>
            )}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => navigate("/#pricing")}
        >
          Upgrade Now
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
