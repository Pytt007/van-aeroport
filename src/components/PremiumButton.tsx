import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
    label: string;
    iconLeft?: LucideIcon;
    iconRight?: LucideIcon;
    variant?: "primary" | "secondary";
}

const PremiumButton = ({
    label,
    iconLeft: IconLeft,
    iconRight: IconRight,
    className,
    variant = "primary",
    ...props
}: PremiumButtonProps) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative flex items-center justify-between w-full h-[68px] p-[6px] rounded-full overflow-hidden transition-all duration-300 shadow-xl border border-border",
                className
            )}
            style={{
                background: "hsl(var(--secondary))",
            }}
            {...props}
        >
            {/* Left Icon Circle (Matches Swipe Thumb) */}
            <div
                className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg shrink-0 transition-colors"
                style={{
                    background: "hsl(var(--primary))",
                }}
            >
                {IconLeft && <IconLeft className="w-6 h-6 text-primary-foreground" />}
            </div>

            {/* Label - Locked in center (Matches Swipe Label) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                <div className="flex items-center gap-2">
                    <span
                        className="font-heading font-semibold text-[11px] uppercase tracking-[0.15em] truncate"
                        style={{ color: "hsl(var(--foreground) / 0.6)" }}
                    >
                        {label}
                    </span>
                    <span className="font-bold text-[11px]" style={{ color: "hsl(var(--foreground) / 0.6)" }}>›››</span>
                </div>
            </div>

            {/* Right Icon Circle (Matches Swipe End Point) */}
            <div
                className="flex items-center justify-center w-14 h-14 rounded-full shrink-0"
                style={{
                    background: "hsl(var(--muted))",
                }}
            >
                {IconRight ? (
                    <IconRight className="w-5 h-5 text-muted-foreground" />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                )}
            </div>
        </motion.button>
    );
};


export default PremiumButton;
