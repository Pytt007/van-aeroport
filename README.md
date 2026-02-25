# Van Aéroport

Votre service de VTC aéroport de Côte d'Ivoire.

## Technologies utilisées

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Auth & Database)

## Lancement local

1. **Cloner le projet**
2. **Installer les dépendances** : `npm install`
3. **Configurer les variables d'environnement** :
   Créez un fichier `.env` à la racine avec :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique
   ```
4. **Lancer le serveur** : `npm run dev`

## Déploiement Netlify

Ce projet est prêt pour Netlify grâce au fichier `netlify.toml` inclus.

**Variables d'environnement requises sur Netlify :**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Assurez-vous de configurer ces variables dans l'interface de Netlify (Site settings > Environment variables) avant de déployer.
