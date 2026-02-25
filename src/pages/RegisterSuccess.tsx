import { motion } from "framer-motion";
import { MailCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";

const RegisterSuccess = () => {
    const navigate = useNavigate();

    return (
        <MobileLayout showNav={false}>
            <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8"
                >
                    <MailCheck className="w-12 h-12 text-primary" />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-md space-y-4"
                >
                    <h1 className="text-3xl font-heading font-bold text-foreground">
                        Inscription terminée !
                    </h1>
                    <p className="text-lg text-muted-foreground font-body leading-relaxed">
                        Un e-mail de validation vous a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams) avant de vous connecter.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-12 w-full max-w-sm space-y-4"
                >
                    <Button
                        onClick={() => navigate("/login", { replace: true })}
                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all"
                    >
                        Se connecter
                    </Button>

                    <button
                        onClick={() => navigate("/login", { replace: true })}
                        className="w-full h-12 flex items-center justify-center text-muted-foreground hover:text-foreground font-heading"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </button>
                </motion.div>


                <footer className="absolute bottom-8 text-sm text-muted-foreground/50 font-body">
                    &copy; {new Date().getFullYear()} Vanaeroport. Tous droits réservés.
                </footer>
            </div>
        </MobileLayout>
    );
};

export default RegisterSuccess;
