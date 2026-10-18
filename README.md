# Expansion Harmonieuse · Faire mieux.

Site de présentation du concept et du programme de Romain Falanga pour la présidentielle 2027.

La page commence par quatre scènes illustrées : vision, gouvernance collective, plateforme des pensées et des idées, monnaie. Le programme détaillé présente d’abord le concept et sa plateforme, puis la monnaie et les échanges avant la définition de l’harmonie, les institutions et la transition.

## Publication
Le dépôt est relié au projet Netlify **expansionharmonieuse** : https://expansionharmonieuse.netlify.app

Chaque mise à jour de la branche `main` déclenche la compilation et la publication via Netlify. Le fichier `netlify.toml` définit Node 22, la commande `npm run check && npm run build` et le dossier `dist`.

```sh
npm install
npm run check
npm run build
```

Aucune clé API ni aucun moteur 3D n’est nécessaire. Les images sont hébergées localement, avec des versions légères pour mobile. L’immersion utilise le défilement natif, des fondus et une avancée dans les illustrations ; les gestes et le clavier restent disponibles. Une lecture simple et les préférences de réduction des mouvements sont prises en compte.

## Contenu
La plateforme, la monnaie et les mécanismes institutionnels sont des propositions du programme. Le site ne simule aucun utilisateur, revenu, compteur de projet ou résultat économique. Les euros issus des ventes sont présentés comme utilisables immédiatement à l’international, sans conversion en Expansion Harmonieuse et sans dépense en France.

## Contrôles et licences
Les contrôles vérifient l’ordre du programme, la suppression des propositions remplacées, les ressources, les ancres, le passage entre les chapitres et le mode de lecture sans mouvements. Ils ne remplacent pas une vérification sur appareil.

Les quatre scènes sont des illustrations originales de projection. Les polices URW Base35 et leur licence sont fournies dans `dist/assets`.
