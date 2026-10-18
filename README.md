# Expansion Harmonieuse · Romain Falanga 2027

Site de présentation du programme pour la présidentielle 2027. Devise : **Faire mieux.**

Le site présente le programme, un parcours immersif piloté par le défilement et la feuille de route. La plateforme, la monnaie et les mécanismes institutionnels décrits sont des propositions du programme.

## Développement et publication

```sh
npm install
npm run check
npm run build
```

Netlify : branche de production `main`, commande `npm run check && npm run build`, dossier publié `dist`, Node.js 22. Le fichier `netlify.toml` définit ces réglages. Une fois le dépôt relié au projet Netlify, chaque commit sur `main` déclenche une nouvelle publication.

Babylon.js 9.31.0 est installé à la compilation puis copié dans le dossier publié. Aucun service IA ni aucune clé API n’est nécessaire. Les animations suivent le défilement natif et une lecture simple est disponible. Les préférences de réduction des mouvements sont respectées ; un visuel SVG est utilisé en repli si le rendu 3D est indisponible.

Les contrôles vérifient le contenu, les ressources, les ancres, le déplacement de caméra et le cycle de vie de la scène avec un moteur de test sans affichage.

## Licences

Babylon.js : Apache-2.0. Les polices URW Base35 et leur licence sont fournies dans `dist/assets`.
