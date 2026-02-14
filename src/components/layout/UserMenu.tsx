import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { useTeamPlus } from "@/hooks/use-team-plus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut, Shield, ShoppingBag, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { isTeamPlus } = useTeamPlus();
  const { toast } = useToast();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile effettuare il logout",
        variant: "destructive",
      });
    }
  };

  // Estrai foto profilo e nome
  let avatarUrl = user.user_metadata?.custom_avatar_url || "";
  
  // Se non c'è avatar custom, prendi dal primo provider OAuth
  if (!avatarUrl && user.identities && user.identities.length > 0) {
    const identity = user.identities[0];
    avatarUrl = identity.identity_data?.avatar_url || identity.identity_data?.picture || "";
  }
  
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Utente";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 glass-card border-border" sideOffset={8}>
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4" />
            Profilo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Impostazioni
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/orders" className="cursor-pointer flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            I Miei Acquisti
          </Link>
        </DropdownMenuItem>
        {(isTeamPlus || isAdmin) && (
          <DropdownMenuSeparator className="bg-border" />
        )}
        {isTeamPlus && (
          <DropdownMenuItem asChild>
            <Link to="/team-plus" className="cursor-pointer flex items-center gap-2 text-primary">
              <Calendar className="h-4 w-4" />
              Team Plus
            </Link>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2 text-destructive focus:text-black hover:text-black">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
