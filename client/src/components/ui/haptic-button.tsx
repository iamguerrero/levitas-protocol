import { Button, ButtonProps } from "@/components/ui/button";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Haptic feedback utility
const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    // Vibration patterns for different intensities
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [25]
    };
    navigator.vibrate(patterns[intensity]);
  }
};

interface HapticButtonProps extends ButtonProps {
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ className, hapticIntensity = 'light', onClick, children, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback
      triggerHaptic(hapticIntensity);
      
      // Call original onClick handler
      if (onClick) {
        onClick(event);
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-150 ease-out",
          "active:scale-95 active:brightness-95",
          "hover:scale-[1.02] hover:shadow-lg",
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

HapticButton.displayName = "HapticButton";

export { HapticButton, triggerHaptic };