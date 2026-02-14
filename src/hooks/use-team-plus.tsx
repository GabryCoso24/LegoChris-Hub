import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook per verificare se l'utente corrente è un membro Team Plus.
 * L'utente è team plus se ha 'team_plus' nel suo array di ruoli o come ruolo singolo
 */
export function useTeamPlus() {
  const { user } = useAuth();

  if (!user) {
    return { isTeamPlus: false, userId: null };
  }

  // Controlla sia app_metadata che user_metadata per compatibilità
  // Supporta sia array di ruoli che ruolo singolo
  const appRoles = user.app_metadata?.roles || user.app_metadata?.role;
  const userRoles = user.user_metadata?.roles || user.user_metadata?.role;
  
  const isTeamPlus = 
    (Array.isArray(appRoles) && appRoles.includes('team_plus')) ||
    appRoles === 'team_plus' ||
    (Array.isArray(userRoles) && userRoles.includes('team_plus')) ||
    userRoles === 'team_plus';

  return { isTeamPlus, userId: user.id };
}
