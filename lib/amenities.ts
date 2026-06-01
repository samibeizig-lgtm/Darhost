import {
  Wifi, Tv, Monitor, Volume2, Gamepad2,
  Wind, Thermometer, Snowflake, Flame,
  UtensilsCrossed, FlameKindling, Microwave, Coffee, Refrigerator, Snowflake as Freezer, Droplets, Waves,
  WashingMachine, Sparkles, Bed, Bath,
  Dumbbell, Sofa,
  Trees, Palmtree, Car, ParkingCircle, Eye, Mountain,
  Shield, AlertTriangle, HeartPulse, AlertCircle, Lock, Camera,
  Accessibility, Baby, Luggage,
  type LucideProps,
} from 'lucide-react';
import { type FC } from 'react';

export type AmenityIcon = FC<LucideProps>;

export interface AmenityItem { id: string; label: string; Icon: AmenityIcon; }
export interface AmenityCategory { label: string; items: AmenityItem[]; }

export const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    label: 'Connectivité & Divertissement',
    items: [
      { id: 'WiFi', label: 'WiFi', Icon: Wifi },
      { id: 'Télévision', label: 'Télévision', Icon: Tv },
      { id: 'TV câblée / satellite', label: 'TV câblée / satellite', Icon: Monitor },
      { id: 'Bureau de travail', label: 'Bureau de travail', Icon: Monitor },
      { id: 'Système audio', label: 'Système audio', Icon: Volume2 },
      { id: 'Console de jeux', label: 'Console de jeux', Icon: Gamepad2 },
    ],
  },
  {
    label: 'Confort climatique',
    items: [
      { id: 'Climatisation', label: 'Climatisation', Icon: Wind },
      { id: 'Chauffage', label: 'Chauffage', Icon: Thermometer },
      { id: 'Ventilateur', label: 'Ventilateur', Icon: Snowflake },
      { id: 'Cheminée', label: 'Cheminée', Icon: Flame },
    ],
  },
  {
    label: 'Cuisine & Électroménager',
    items: [
      { id: 'Cuisine équipée', label: 'Cuisine équipée', Icon: UtensilsCrossed },
      { id: 'Plaques de cuisson', label: 'Plaques de cuisson', Icon: FlameKindling },
      { id: 'Four', label: 'Four', Icon: Microwave },
      { id: 'Micro-ondes', label: 'Micro-ondes', Icon: Microwave },
      { id: 'Cafetière', label: 'Cafetière', Icon: Coffee },
      { id: 'Bouilloire', label: 'Bouilloire', Icon: Coffee },
      { id: 'Réfrigérateur', label: 'Réfrigérateur', Icon: Refrigerator },
      { id: 'Congélateur', label: 'Congélateur', Icon: Freezer },
      { id: 'Lave-vaisselle', label: 'Lave-vaisselle', Icon: Droplets },
      { id: 'Grille-pain', label: 'Grille-pain', Icon: FlameKindling },
      { id: 'Mixeur / Blender', label: 'Mixeur / Blender', Icon: Waves },
    ],
  },
  {
    label: 'Linge & Entretien',
    items: [
      { id: 'Lave-linge', label: 'Lave-linge', Icon: WashingMachine },
      { id: 'Sèche-linge', label: 'Sèche-linge', Icon: Wind },
      { id: 'Fer à repasser', label: 'Fer à repasser', Icon: Sparkles },
      { id: 'Sèche-cheveux', label: 'Sèche-cheveux', Icon: Wind },
      { id: 'Matériel de nettoyage', label: 'Matériel de nettoyage', Icon: Sparkles },
      { id: 'Produits de salle de bain', label: 'Produits de salle de bain', Icon: Droplets },
      { id: 'Linge de lit fourni', label: 'Linge de lit fourni', Icon: Bed },
      { id: 'Serviettes fournies', label: 'Serviettes fournies', Icon: Bath },
    ],
  },
  {
    label: 'Détente & Bien-être',
    items: [
      { id: 'Piscine', label: 'Piscine', Icon: Waves },
      { id: 'Jacuzzi / Bain à remous', label: 'Jacuzzi / Bain à remous', Icon: Bath },
      { id: 'Hammam / Sauna', label: 'Hammam / Sauna', Icon: Thermometer },
      { id: 'Salle de sport', label: 'Salle de sport', Icon: Dumbbell },
      { id: 'Billard', label: 'Billard', Icon: Sofa },
      { id: 'Ping-pong', label: 'Ping-pong', Icon: Sofa },
    ],
  },
  {
    label: 'Extérieur & Parking',
    items: [
      { id: 'Jardin', label: 'Jardin', Icon: Trees },
      { id: 'Terrasse', label: 'Terrasse / Balcon', Icon: Sofa },
      { id: 'Barbecue', label: 'Barbecue', Icon: Flame },
      { id: 'Vue mer', label: 'Vue mer', Icon: Eye },
      { id: 'Vue montagne', label: 'Vue montagne', Icon: Mountain },
      { id: 'Accès plage', label: 'Accès plage', Icon: Palmtree },
      { id: 'Parking gratuit', label: 'Parking gratuit', Icon: ParkingCircle },
      { id: 'Garage', label: 'Garage', Icon: Car },
    ],
  },
  {
    label: 'Sécurité',
    items: [
      { id: 'Détecteur de fumée', label: 'Détecteur de fumée', Icon: AlertTriangle },
      { id: 'Extincteur', label: 'Extincteur', Icon: Shield },
      { id: 'Trousse de premiers secours', label: 'Trousse de secours', Icon: HeartPulse },
      { id: 'Détecteur CO', label: 'Détecteur de CO', Icon: AlertCircle },
      { id: 'Serrure connectée', label: 'Serrure connectée', Icon: Lock },
      { id: 'Caméra de sécurité', label: 'Caméra extérieure', Icon: Camera },
    ],
  },
  {
    label: 'Accessibilité & Services',
    items: [
      { id: 'Ascenseur', label: 'Ascenseur', Icon: Accessibility },
      { id: 'Accès PMR', label: 'Accès PMR', Icon: Accessibility },
      { id: 'Lit bébé', label: 'Lit bébé', Icon: Baby },
      { id: 'Chaise haute bébé', label: 'Chaise haute bébé', Icon: Baby },
      { id: 'Consigne à bagages', label: 'Consigne à bagages', Icon: Luggage },
    ],
  },
];
