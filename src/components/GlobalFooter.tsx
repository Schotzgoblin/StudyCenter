import Link from "next/link";
import { Heart } from "lucide-react";

export default function GlobalFooter() {
  return (
    <footer className="border-t border-border/10 bg-card/10 py-8 px-6 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-display font-bold text-foreground">
              StudyCenter
            </span>
            <span className="w-1 h-1 rounded-full bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} StudyCenter. Universal Student Portal.
          </p>
        </div>

        {/* Right: Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/support" className="hover:text-foreground transition-colors">
            Support
          </Link>
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-border/20 px-3 py-1.5 rounded-full hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
          >
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>Buy Me a Coffee</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
