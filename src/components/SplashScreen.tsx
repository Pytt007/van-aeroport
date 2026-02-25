import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import LogoDark from "../assets/Logo.png";
import LogoLight from "../assets/logolight.png";

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
    const { theme } = useTheme();
    const [isVisible, setIsVisible] = useState(true);

    const logoSrc = theme === "light" ? LogoLight : LogoDark;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 500); // Wait for exit animation
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.8,
                    ease: [0, 0.71, 0.2, 1.01],
                    scale: {
                        type: "spring",
                        damping: 12,
                        stiffness: 100,
                        restDelta: 0.001
                    }
                }}
                className="relative"
            >
                <div className="flex flex-col items-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                    >
                        <img
                            src={logoSrc}
                            alt="AÉROPORT Logo"
                            className="w-[280px] h-auto drop-shadow-[0_0_20px_rgba(246,177,4,0.3)]"
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Loading bar animation */}
            <div className="absolute bottom-20 w-40 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-full h-full bg-primary"
                />
            </div>
        </motion.div>
    );
};

export default SplashScreen;
