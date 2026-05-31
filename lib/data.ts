import { Property, Conversation } from './types';

export const properties: Property[] = [];

export const CATEGORIES = [
  { value: 'plage', label: 'Plage' },
  { value: 'medina', label: 'Médina' },
  { value: 'montagne', label: 'Montagne' },
  { value: 'desert', label: 'Désert' },
  { value: 'piscine', label: 'Piscine' },
  { value: 'nature', label: 'Nature' },
  { value: 'historique', label: 'Historique' },
  { value: 'mer', label: 'Bord de mer' },
];

export const wilayasTunisie = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
  'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

export const localitesTunisie = [
  'Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa',
  'Kairouan', 'Kasserine', 'Médenine', 'Nabeul', 'Béja', 'Ben Arous', 'Mahdia',
  'Sidi Bouzid', 'Siliana', 'Kébili', 'Zaghouan', 'Jendouba', 'Kef', 'Manouba',
  'Tataouine', 'Tozeur',
  'Sidi Bou Said', 'La Marsa', 'Carthage', 'Gammarth', 'La Goulette', 'Le Bardo',
  'Lac 1', 'Lac 2', 'Les Berges du Lac', 'El Menzah', 'El Manar', 'El Aouina',
  'Ennasr', 'Raoued', 'La Soukra', 'Ettadhamen', 'Cité Sportive', 'Bab Bhar',
  'Médina de Tunis', 'Montplaisir', 'Mutuelleville', 'Cité Jardins',
  'Hammamet', 'Hammamet Nord', 'Hammamet Sud', 'Yasmine Hammamet', 'Nabeul Centre',
  'Kelibia', 'Korba', 'Soliman', 'Grombalia', 'Dar Chaâbane',
  'Djerba', 'Djerba Midoun', 'Djerba Houmt Souk', 'Djerba Aghir', 'Zarzis',
  'Ben Guerdane', 'Djerba Erriadh',
  'Mahdia Centre', 'El Jem', 'Chebba', 'Ksour Essef',
  'Monastir Centre', 'Skanes', 'Ksar Hellal', 'Moknine', 'Ksibet el-Médiouni',
  'Sousse Centre', 'Kantaoui', 'Port El Kantaoui', 'Hammam Sousse', 'Akouda',
  'Enfidha', 'Msaken', 'Kalaa Kebira',
  'Sfax Centre', 'Sfax Sud', 'Sfax Nord', 'Thyna', 'Agareb',
  'Gabès Centre', 'El Hamma', 'Matmata',
  'Kairouan Centre', 'El Fahs', 'Sbikha',
  'Tabarka', 'Aïn Draham', 'Fernana', 'Jendouba Centre',
  'Tozeur Centre', 'Nefta', 'Degache', 'El Hamma du Jerid',
  'Kébili Centre', 'Douz', 'Souk Lahad',
  'Gafsa Centre', 'Métlaoui', 'El Kef Centre', 'Nebeur',
  'Kasserine Centre', 'Sbeitla', 'Foussana',
  'Bizerte Centre', 'Menzel Bourguiba', 'Mateur', 'Ras Jebel',
  'Béja Centre', 'Testour', 'Thibar',
  'Tataouine Centre', 'Ghomrassen', 'Beni Khedache',
];

export const conversations: Conversation[] = [];
