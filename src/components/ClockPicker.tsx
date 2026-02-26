import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClockPickerProps {
    value: string; // "HH:mm"
    onChange: (value: string) => void;
}

const ClockPicker: React.FC<ClockPickerProps> = ({ value, onChange }) => {
    const [hours, setHours] = useState(parseInt(value.split(":")[0]) || 8);
    const [minutes, setMinutes] = useState(parseInt(value.split(":")[1]) || 0);
    const [mode, setMode] = useState<"hours" | "minutes">("hours");

    const handleHourSelect = (h: number) => {
        setHours(h);
        setMode("minutes");
    };

    const handleMinuteSelect = (m: number) => {
        setMinutes(m);
        onChange(`${hours.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    };

    useEffect(() => {
        const [h, m] = value.split(":").map(Number);
        setHours(h);
        setMinutes(m);
    }, [value]);

    const renderNumbers = () => {
        if (mode === "hours") {
            // 12-hour format or 24? Let's do 24 with two rings or just 0-23 list.
            // For simplicity and matching the image (which shows 1-12), let's do 0-23 in two rings if possible, 
            // or just 1-12 and an AM/PM toggle. Usually these pickers show 0-23.
            const hoursArray = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            const hours24Array = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

            return (
                <>
                    {hoursArray.map((h, i) => {
                        const angle = (i * 30) - 90;
                        const x = 50 + 38 * Math.cos((angle * Math.PI) / 180);
                        const y = 50 + 38 * Math.sin((angle * Math.PI) / 180);
                        const isSelected = hours === h || (h === 12 && hours === 0);

                        return (
                            <button
                                key={h}
                                onClick={() => handleHourSelect(h === 12 ? 0 : h)}
                                className={cn(
                                    "absolute flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm font-medium transition-colors z-10",
                                    isSelected ? "text-primary-foreground" : "text-foreground hover:bg-secondary"
                                )}
                                style={{ left: `${x}%`, top: `${y}%` }}
                            >
                                {h}
                            </button>
                        );
                    })}
                    {/* Outer ring for 13-23 */}
                    {hours24Array.map((h, i) => {
                        const angle = (i * 30) - 90;
                        const x = 50 + 22 * Math.cos((angle * Math.PI) / 180);
                        const y = 50 + 22 * Math.sin((angle * Math.PI) / 180);
                        const isSelected = hours === h;

                        return (
                            <button
                                key={h}
                                onClick={() => handleHourSelect(h)}
                                className={cn(
                                    "absolute flex items-center justify-center w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full text-[10px] font-medium transition-colors z-10",
                                    isSelected ? "text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                                )}
                                style={{ left: `${x}%`, top: `${y}%` }}
                            >
                                {h}
                            </button>
                        );
                    })}
                </>
            );
        } else {
            const minutesArray = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
            return minutesArray.map((m, i) => {
                const angle = (i * 30) - 90;
                const x = 50 + 38 * Math.cos((angle * Math.PI) / 180);
                const y = 50 + 38 * Math.sin((angle * Math.PI) / 180);
                const isSelected = minutes === m;

                return (
                    <button
                        key={m}
                        onClick={() => handleMinuteSelect(m)}
                        className={cn(
                            "absolute flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm font-medium transition-colors z-10",
                            isSelected ? "text-primary-foreground" : "text-foreground hover:bg-secondary"
                        )}
                        style={{ left: `${x}%`, top: `${y}%` }}
                    >
                        {m.toString().padStart(2, "0")}
                    </button>
                );
            });
        }
    };

    const getHandRotation = () => {
        if (mode === "hours") {
            const val = hours % 12;
            return (val * 30);
        } else {
            return (minutes * 6);
        }
    };

    const getHandLength = () => {
        if (mode === "hours" && hours >= 13 || hours === 0) {
            return "22%";
        }
        return "38%";
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Time Display Overlay */}
            <div className="flex items-baseline gap-2 text-4xl font-heading font-bold bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                <button
                    onClick={() => setMode("hours")}
                    className={cn("transition-colors", mode === "hours" ? "text-primary" : "text-muted-foreground")}
                >
                    {hours.toString().padStart(2, "0")}
                </button>
                <span className="text-muted-foreground">:</span>
                <button
                    onClick={() => setMode("minutes")}
                    className={cn("transition-colors", mode === "minutes" ? "text-primary" : "text-muted-foreground")}
                >
                    {minutes.toString().padStart(2, "0")}
                </button>
            </div>

            {/* Clock Face Container */}
            <div className="relative w-72 h-72 rounded-full bg-secondary/30 border border-border flex items-center justify-center overflow-hidden">
                {/* Center Point */}
                <div className="absolute w-2 h-2 rounded-full bg-primary z-20" />

                {/* The Hand */}
                <motion.div
                    className="absolute origin-bottom bg-primary z-10 pointer-events-none"
                    initial={false}
                    animate={{
                        rotate: getHandRotation(),
                        height: getHandLength(),
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ bottom: "50%", width: "2px" }}
                >
                    {/* The Knob */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary shadow-lg" />
                </motion.div>

                {/* Numbers Container */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                    >
                        {renderNumbers()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClockPicker;
