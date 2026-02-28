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

### Option A : Via GitHub (Le plus sûr)
1. **Sur le PC actuel** : Sauvegardez tout avec : 
   `git add . ; git commit -m "Sync avant changement PC" ; git push`
2. **Sur le nouveau PC** : Téléchargez le projet :
   `git clone https://github.com/Pytt007/vanaeroport.git`
3. **Crucial** : Copiez le fichier `.env` du PC 1 vers le PC 2 (Git ne le prend pas pour des raisons de sécurité).
4. **Installez** : `npm install` puis `npm run dev`.

### Option B : Via Clé USB (Le plus rapide)
1. Copiez tout le dossier **Vanaeroport**.
2. **Astuce** : Supprimez le dossier `node_modules` (très lourd) avant de copier.
3. Sur le nouveau PC, ouvrez le dossier et faites `npm install`.
4. Le fichier `.env` sera déjà là car vous avez copié tout le dossier.

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
