# 🚀 Guide d'Entretien du Projet - Vanaeroport

Ce guide résume les commandes essentielles pour gérer votre application, la mettre à jour et travailler sur plusieurs ordinateurs.

## 🛠️ Commandes au Quotidien

Chaque fois que vous avez terminé une modification et que vous voulez la sauvegarder et mettre à jour le site en ligne :

```powershell
# 1. Préparer tous les fichiers modifiés
git add .

# 2. Enregistrer les modifications avec un message
git commit -m "Description de ce que j'ai changé"

# 3. Envoyer sur GitHub (ceci mettra le site à jour automatiquement via Vercel)
git push
```

---

## 💻 Passer sur un autre Ordinateur

Si vous voulez travailler sur votre projet depuis un nouveau PC :

### Option A : Via GitHub (Recommandé)
1. **Cloner le projet** (une seule fois) :
   `git clone https://github.com/Pytt007/vanaeroport.git`
2. **Installer les outils** (node_modules) :
   `npm install`
3. **Recréer le fichier `.env`** avec vos clés Supabase. 

### Option B : Via Copie Manuelle (Clé USB)
1. Copiez tout le dossier (incluant le dossier caché `.git`).
2. **Important** : Supprimez le dossier `node_modules` sur l'ancien PC avant de copier pour aller plus vite.
3. Sur le nouveau PC, lancez `npm install`.

---

## 🌐 Mise en ligne (Vercel)

Votre application est liée à votre dépôt GitHub sur Vercel. 

- **Lien du code** : [https://github.com/Pytt007/vanaeroport](https://github.com/Pytt007/vanaeroport)
- **Mise à jour** : Automatique à chaque `git push`.
- **Variables d'environnement** : Assurez-vous que `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont configurées dans les réglages de votre projet sur Vercel.

---

## ⚠️ Rappels de Sécurité
- Ne partagez jamais votre fichier `.env`.
- Le dossier `node_modules` et `dist` sont ignorés par Git, c'est normal ! (Ils sont recréés par `npm install` et `npm run build`).
