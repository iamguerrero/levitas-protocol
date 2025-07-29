import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            © 2025 <span className="font-semibold text-primary">Levitas Finance</span>. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Toggle theme
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}