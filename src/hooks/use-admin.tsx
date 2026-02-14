import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook per verificare se l'utente corrente è un admin.
 * L'utente è admin se ha 'admin' nel suo array di ruoli o come ruolo singolo
 */
export function useAdmin() {
  const { user } = useAuth();

  if (!user) {
    return { isAdmin: false };
  }

  // Controlla sia app_metadata che user_metadata per compatibilità
  // Supporta sia array di ruoli che ruolo singolo
  const appRoles = user.app_metadata?.roles || user.app_metadata?.role;
  const userRoles = user.user_metadata?.roles || user.user_metadata?.role;
  
  const isAdmin = 
    (Array.isArray(appRoles) && appRoles.includes('admin')) ||
    appRoles === 'admin' ||
    (Array.isArray(userRoles) && userRoles.includes('admin')) ||
    userRoles === 'admin';

  return { isAdmin };
}
