export interface AmenityItem { id: string; emoji: string; label: string; }
export interface AmenityCategory { label: string; items: AmenityItem[]; }

export const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    label: 'Connectivité & Divertissement',
    items: [
      { id: 'WiFi', emoji: '📶', label: 'WiFi' },
      { id: 'Télévision', emoji: '📺', label: 'Télévision' },
      { id: 'TV câblée / satellite', emoji: '📡', label: 'TV câblée / satellite' },
      { id: 'Bureau de travail', emoji: '💻', label: 'Bureau de travail' },
      { id: 'Système audio', emoji: '🔊', label: 'Système audio' },
      { id: 'Console de jeux', emoji: '🎮', label: 'Console de jeux' },
    ],
  },
  {
    label: 'Confort climatique',
    items: [
      { id: 'Climatisation', emoji: '❄️', label: 'Climatisation' },
      { id: 'Chauffage', emoji: '🌡️', label: 'Chauffage' },
      { id: 'Ventilateur', emoji: '🌀', label: 'Ventilateur' },
      { id: 'Cheminée', emoji: '🪵', label: 'Cheminée' },
    ],
  },
  {
    label: 'Cuisine & Électroménager',
    items: [
      { id: 'Cuisine équipée', emoji: '🍳', label: 'Cuisine équipée' },
      { id: 'Plaques de cuisson', emoji: '🔥', label: 'Plaques de cuisson' },
      { id: 'Four', emoji: '🫓', label: 'Four' },
      { id: 'Micro-ondes', emoji: '📟', label: 'Micro-ondes' },
      { id: 'Cafetière', emoji: '☕', label: 'Cafetière' },
      { id: 'Bouilloire', emoji: '🫖', label: 'Bouilloire' },
      { id: 'Réfrigérateur', emoji: '🧊', label: 'Réfrigérateur' },
      { id: 'Congélateur', emoji: '🫙', label: 'Congélateur' },
      { id: 'Lave-vaisselle', emoji: '🍽️', label: 'Lave-vaisselle' },
      { id: 'Grille-pain', emoji: '🍞', label: 'Grille-pain' },
      { id: 'Mixeur / Blender', emoji: '🥤', label: 'Mixeur / Blender' },
    ],
  },
  {
    label: 'Linge & Entretien',
    items: [
      { id: 'Lave-linge', emoji: '🧺', label: 'Lave-linge' },
      { id: 'Sèche-linge', emoji: '🌀', label: 'Sèche-linge' },
      { id: 'Fer à repasser', emoji: '👔', label: 'Fer à repasser' },
      { id: 'Sèche-cheveux', emoji: '💨', label: 'Sèche-cheveux' },
      { id: 'Matériel de nettoyage', emoji: '🧹', label: 'Matériel de nettoyage' },
      { id: 'Produits de salle de bain', emoji: '🧴', label: 'Produits de salle de bain' },
      { id: 'Linge de lit fourni', emoji: '🛏️', label: 'Linge de lit fourni' },
      { id: 'Serviettes fournies', emoji: '🏖️', label: 'Serviettes fournies' },
    ],
  },
  {
    label: 'Détente & Bien-être',
    items: [
      { id: 'Piscine', emoji: '🏊', label: 'Piscine' },
      { id: 'Jacuzzi / Bain à remous', emoji: '🛁', label: 'Jacuzzi / Bain à remous' },
      { id: 'Hammam / Sauna', emoji: '🧖', label: 'Hammam / Sauna' },
      { id: 'Salle de sport', emoji: '🏋️', label: 'Salle de sport' },
      { id: 'Billard', emoji: '🎱', label: 'Billard' },
      { id: 'Ping-pong', emoji: '🏓', label: 'Ping-pong' },
    ],
  },
  {
    label: 'Extérieur & Parking',
    items: [
      { id: 'Jardin', emoji: '🌿', label: 'Jardin' },
      { id: 'Terrasse', emoji: '🪴', label: 'Terrasse / Balcon' },
      { id: 'Barbecue', emoji: '🍖', label: 'Barbecue' },
      { id: 'Vue mer', emoji: '🌊', label: 'Vue mer' },
      { id: 'Vue montagne', emoji: '⛰️', label: 'Vue montagne' },
      { id: 'Accès plage', emoji: '🏖️', label: 'Accès plage' },
      { id: 'Parking gratuit', emoji: '🅿️', label: 'Parking gratuit' },
      { id: 'Garage', emoji: '🚗', label: 'Garage' },
    ],
  },
  {
    label: 'Sécurité',
    items: [
      { id: 'Détecteur de fumée', emoji: '🚨', label: 'Détecteur de fumée' },
      { id: 'Extincteur', emoji: '🧯', label: 'Extincteur' },
      { id: 'Trousse de premiers secours', emoji: '🩺', label: 'Trousse de secours' },
      { id: 'Détecteur CO', emoji: '⚠️', label: 'Détecteur de CO' },
      { id: 'Serrure connectée', emoji: '🔐', label: 'Serrure connectée' },
      { id: 'Caméra de sécurité', emoji: '📹', label: 'Caméra extérieure' },
    ],
  },
  {
    label: 'Accessibilité & Services',
    items: [
      { id: 'Ascenseur', emoji: '🛗', label: 'Ascenseur' },
      { id: 'Accès PMR', emoji: '♿', label: 'Accès PMR' },
      { id: 'Lit bébé', emoji: '👶', label: 'Lit bébé' },
      { id: 'Chaise haute bébé', emoji: '🪑', label: 'Chaise haute bébé' },
      { id: 'Consigne à bagages', emoji: '🎒', label: 'Consigne à bagages' },
    ],
  },
];
