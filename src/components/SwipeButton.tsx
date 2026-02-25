import { LucideIcon } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SwipeButtonProps {
    label: string;
    icon?: LucideIcon;
    onConfirm: () => void;
    className?: string;
}

export default function SwipeButton({ label, icon: Icon, onConfirm, className }: SwipeButtonProps) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);

    const THUMB_SIZE = 56;
    const PADDING = 6;

    const getMaxDrag = useCallback(() => {
        if (!containerRef.current) return 0;
        return containerRef.current.offsetWidth - THUMB_SIZE - PADDING * 2;
    }, []);

    const handleStart = (clientX: number) => {
        if (isComplete) return;
        setIsDragging(true);
        startXRef.current = clientX - dragX;
    };

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || isComplete) return;
        const max = getMaxDrag();
        const newX = Math.max(0, Math.min(clientX - startXRef.current, max));
        setDragX(newX);
        if (newX >= max * 0.93) {
            setIsComplete(true);
            setIsDragging(false);
            setDragX(max);
            if (onConfirm) onConfirm();
        }
    }, [isDragging, isComplete, getMaxDrag, onConfirm]);

    const handleEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (!isComplete) setDragX(0);
    }, [isDragging, isComplete]);

    useEffect(() => {
        if (isDragging) {
            const onMove = (e: MouseEvent | TouchEvent) => {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                handleMove(clientX);
            };
            const onEnd = () => handleEnd();

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);

            return () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
            };
        }
    }, [isDragging, handleMove, handleEnd]);

    const progress = containerRef.current ? (dragX / getMaxDrag()) : 0;

    return (
        <div
            ref={containerRef}
            onClick={isComplete ? () => { setIsComplete(false); setDragX(0); } : undefined}
            className={cn("relative w-full h-[68px] rounded-full flex items-center select-none overflow-hidden touch-none", className)}
            style={{
                background: "hsl(var(--secondary))",
                border: "1px solid hsl(var(--border))",
                cursor: isComplete ? "pointer" : "default",
            }}
        >
            {/* Thumb (left) */}
            <div
                onMouseDown={(e) => handleStart(e.clientX)}
                onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                style={{
                    position: "absolute",
                    left: PADDING + dragX,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderRadius: "50%",
                    background: isComplete ? "hsl(var(--success, 142 76% 36%))" : "hsl(var(--primary))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isComplete ? "pointer" : "grab",
                    zIndex: 2,
                    boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
                    transition: isDragging ? "none" : "left 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s",
                }}
            >
                {isComplete ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    Icon ? <Icon className="w-6 h-6 text-primary-foreground" /> : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                    )
                )}
            </div>

            {/* Label */}
            <div style={{
                position: "absolute",
                left: PADDING + THUMB_SIZE,
                right: PADDING + THUMB_SIZE,
                textAlign: "center",
                color: "hsl(var(--foreground) / 0.6)",
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.15em",
                pointerEvents: "none",
                opacity: Math.max(0, 1 - progress * 2),
                transition: "opacity 0.2s",
                zIndex: 1,
            }}>
                <span className="uppercase">{label}</span> ›››
            </div>

            {/* Right lock icon */}
            <div style={{
                position: "absolute",
                right: PADDING,
                top: "50%",
                transform: "translateY(-50%)",
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: "50%",
                background: "hsl(var(--muted))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: Math.max(0, 1 - progress * 2),
                transition: "opacity 0.2s",
                zIndex: 1,
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            </div>
        </div>
    );
}
