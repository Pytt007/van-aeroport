import { ArrowLeft, Star, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileDrawer from "./MobileDrawer";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface MobileHeaderProps {
  title: string | React.ReactNode;
  showBack?: boolean;
  showStar?: boolean;
  showProfile?: boolean;
  onBack?: () => void;
  onStar?: () => void;
  starActive?: boolean;
}

const MobileHeader = ({
  title,
  showBack = true,
  showStar = false,
  showProfile = false,
  onBack,
  onStar,
  starActive = false,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Voyageur";
  const initials = displayName[0]?.toUpperCase() || "V";
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-background/90 backdrop-blur-md sticky top-0 z-30 border-b border-border/50"
        style={{ paddingTop: "max(env(safe-area-inset-top), 32px)" }}
      >
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack || (() => navigate(-1))}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform shrink-0"
            >
              <ArrowLeft className="w-[18px] h-[18px] text-foreground" />
            </button>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform shrink-0"
            >
              <Menu className="w-[18px] h-[18px] text-foreground" />
            </button>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <h1 className="text-[15px] font-heading font-semibold tracking-tight leading-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showStar && (
            <button
              onClick={onStar}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform shrink-0"
            >
              <Star className={`w-[18px] h-[18px] ${starActive ? "fill-primary text-primary" : "text-foreground"}`} />
            </button>
          )}

          {showProfile ? (
            <button
              onClick={() => navigate("/profile")}
              className="active:scale-95 transition-transform shrink-0"
            >
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            !showStar && <div className="w-9" />
          )}
        </div>
      </div>
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default MobileHeader;

