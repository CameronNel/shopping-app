import type { CatalogItem, CategoryId } from '@/types';

/**
 * The bundled item bank. Stored as `name|unit|emoji` tuples grouped by category
 * so this file stays legible as it grows — expanded into CatalogItem[] once at
 * module load. Names are Dutch to match shelf labels and the deals feed.
 */
const RAW: Record<CategoryId, string[]> = {
  'groente-fruit': [
    'Appels|stuks|🍎', 'Bananen|stuks|🍌', 'Peren|stuks|🍐', 'Sinaasappels|stuks|🍊',
    'Mandarijnen|net|🍊', 'Citroenen|stuks|🍋', 'Limoenen|stuks|🍋', 'Druiven|bak|🍇',
    'Aardbeien|bak|🍓', 'Blauwe bessen|bak|🫐', 'Frambozen|bak|🍓', 'Kiwi|stuks|🥝',
    'Ananas|stuk|🍍', 'Mango|stuk|🥭', 'Meloen|stuk|🍈', 'Watermeloen|stuk|🍉',
    'Perziken|stuks|🍑', 'Nectarines|stuks|🍑', 'Pruimen|stuks|🍑', 'Avocado|stuks|🥑',
    'Tomaten|kg|🍅', 'Cherrytomaten|bak|🍅', 'Komkommer|stuk|🥒', 'Paprika|stuks|🫑',
    'Courgette|stuk|🥒', 'Aubergine|stuk|🍆', 'Broccoli|stuk|🥦', 'Bloemkool|stuk|🥦',
    'Wortels|kg|🥕', 'Ui|kg|🧅', 'Rode ui|stuks|🧅', 'Knoflook|bol|🧄',
    'Aardappelen|kg|🥔', 'Kruimige aardappelen|kg|🥔', 'Zoete aardappel|kg|🍠',
    'Sla|krop|🥬', 'IJsbergsla|krop|🥬', 'Rucola|zak|🥬', 'Spinazie|zak|🥬',
    'Andijvie|zak|🥬', 'Boerenkool|zak|🥬', 'Spruitjes|zak|🥬', 'Witlof|stuks|🥬',
    'Prei|stuks|🥬', 'Champignons|bak|🍄', 'Sperziebonen|zak|🫛', 'Doperwten|zak|🫛',
    'Mais|blik|🌽', 'Bosui|bos|🧅', 'Selderij|bos|🌿', 'Peterselie|bos|🌿',
    'Basilicum|potje|🌿', 'Verse gember|stuk|🫚', 'Radijs|bos|🥗', 'Rode kool|stuk|🥬',
    'Witte kool|stuk|🥬', 'Pompoen|stuk|🎃', 'Gemengde salade|zak|🥗', 'Rauwkost|bak|🥗',
  ],
  'vlees-vis': [
    'Kipfilet|pak|🍗', 'Kipdijfilet|pak|🍗', 'Kippenpoten|pak|🍗', 'Hele kip|stuk|🍗',
    'Gehakt half om half|pak|🥩', 'Rundergehakt|pak|🥩', 'Hamburgers|pak|🍔',
    'Braadworst|pak|🌭', 'Rookworst|stuk|🌭', 'Speklapjes|pak|🥓', 'Bacon|pak|🥓',
    'Varkenshaas|pak|🥩', 'Schnitzel|pak|🥩', 'Biefstuk|pak|🥩', 'Riblappen|pak|🥩',
    'Shoarmavlees|pak|🥙', 'Kipsaté|pak|🍢', 'Zalmfilet|pak|🐟', 'Kabeljauw|pak|🐟',
    'Tilapia|pak|🐟', 'Pangasius|pak|🐟', 'Garnalen|bak|🦐', 'Gerookte zalm|pak|🐟',
    'Haring|stuks|🐟', 'Kibbeling|bak|🐟', 'Vissticks|pak|🐟', 'Tonijn in blik|blik|🐟',
    'Vegetarische burger|pak|🌱', 'Vegetarische gehakt|pak|🌱', 'Tofu|pak|🌱',
    'Tempeh|pak|🌱', 'Falafel|pak|🌱',
  ],
  zuivel: [
    'Halfvolle melk|liter|🥛', 'Volle melk|liter|🥛', 'Magere melk|liter|🥛',
    'Karnemelk|liter|🥛', 'Havermelk|liter|🌾', 'Amandelmelk|liter|🌰', 'Sojamelk|liter|🌱',
    'Yoghurt naturel|liter|🥛', 'Griekse yoghurt|bak|🥛', 'Vla|liter|🍮',
    'Kwark|bak|🥛', 'Skyr|bak|🥛', 'Slagroom|pak|🥛', 'Kookroom|pak|🥛',
    'Crème fraîche|bak|🥛', 'Roomboter|pak|🧈', 'Halvarine|kuipje|🧈', 'Margarine|kuipje|🧈',
    'Eieren|doos|🥚', 'Scharreleieren|doos|🥚', 'Biologische eieren|doos|🥚',
    'Koffiemelk|pak|🥛', 'Drinkyoghurt|fles|🥛', 'Chocolademelk|liter|🍫',
  ],
  brood: [
    'Bruin brood|stuk|🍞', 'Wit brood|stuk|🍞', 'Volkoren brood|stuk|🍞',
    'Meergranen brood|stuk|🍞', 'Tijgerbrood|stuk|🍞', 'Stokbrood|stuk|🥖',
    'Croissants|stuks|🥐', 'Krentenbollen|stuks|🥯', 'Bagels|stuks|🥯',
    'Pistolets|stuks|🥖', 'Wraps|pak|🌯', 'Pitabroodjes|pak|🫓', 'Naanbrood|pak|🫓',
    'Beschuit|rol|🍘', 'Crackers|pak|🍘', 'Knäckebröd|pak|🍘', 'Ontbijtkoek|stuk|🍞',
    'Appeltaart|stuk|🥧', 'Koekjes|pak|🍪', 'Stroopwafels|pak|🧇', 'Cake|stuk|🍰',
    'Muffins|stuks|🧁', 'Donuts|stuks|🍩',
  ],
  'kaas-beleg': [
    'Jong belegen kaas|pak|🧀', 'Belegen kaas|pak|🧀', 'Oude kaas|pak|🧀',
    'Geraspte kaas|zak|🧀', 'Mozzarella|bol|🧀', 'Feta|pak|🧀', 'Roomkaas|kuipje|🧀',
    'Parmezaanse kaas|stuk|🧀', 'Brie|stuk|🧀', 'Smeerkaas|kuipje|🧀',
    'Ham|pak|🥓', 'Kipfilet beleg|pak|🍗', 'Salami|pak|🥓', 'Rosbief|pak|🥩',
    'Leverworst|stuk|🥓', 'Filet americain|kuipje|🥩', 'Pindakaas|pot|🥜',
    'Hagelslag|pak|🍫', 'Chocoladepasta|pot|🍫', 'Jam|pot|🍓', 'Honing|pot|🍯',
    'Appelstroop|pot|🍎', 'Vlokken|pak|🍫',
  ],
  voorraadkast: [
    'Spaghetti|pak|🍝', 'Penne|pak|🍝', 'Macaroni|pak|🍝', 'Lasagnebladen|pak|🍝',
    'Rijst|pak|🍚', 'Zilvervliesrijst|pak|🍚', 'Basmatirijst|pak|🍚', 'Couscous|pak|🌾',
    'Bulgur|pak|🌾', 'Quinoa|pak|🌾', 'Linzen|pak|🫘', 'Kikkererwten|blik|🫘',
    'Bruine bonen|blik|🫘', 'Kidneybonen|blik|🫘', 'Tomatenblokjes|blik|🍅',
    'Passata|fles|🍅', 'Tomatenpuree|blik|🍅', 'Pastasaus|pot|🍝', 'Pesto|pot|🌿',
    'Kokosmelk|blik|🥥', 'Bouillonblokjes|pak|🧂', 'Zout|pak|🧂', 'Peper|potje|🧂',
    'Paprikapoeder|potje|🧂', 'Kerriepoeder|potje|🧂', 'Italiaanse kruiden|potje|🌿',
    'Olijfolie|fles|🫒', 'Zonnebloemolie|fles|🌻', 'Azijn|fles|🍶', 'Balsamicoazijn|fles|🍶',
    'Sojasaus|fles|🍶', 'Ketchup|fles|🍅', 'Mayonaise|fles|🥚', 'Mosterd|pot|🌭',
    'Curryketchup|fles|🍅', 'Sambal|pot|🌶️', 'Bloem|pak|🌾', 'Zelfrijzend bakmeel|pak|🌾',
    'Suiker|pak|🍬', 'Basterdsuiker|pak|🍬', 'Havermout|pak|🌾', 'Cornflakes|pak|🥣',
    'Muesli|pak|🥣', 'Cruesli|pak|🥣', 'Noten mix|zak|🥜', 'Rozijnen|zak|🍇',
    'Bakpapier|rol|📄', 'Aluminiumfolie|rol|📄', 'Vershoudfolie|rol|📄',
  ],
  diepvries: [
    'Diepvriespizza|stuk|🍕', 'Frikandellen|zak|🌭', 'Kroketten|zak|🥐',
    'Friet|zak|🍟', 'Aardappelpartjes|zak|🥔', 'Diepvriesgroenten|zak|🥦',
    'Diepvriesspinazie|pak|🥬', 'Diepvriesfruit|zak|🍓', 'IJs|bak|🍦',
    'Magnum|doos|🍦', 'Loempia|zak|🥟', 'Diepvriesvis|pak|🐟', 'IJsblokjes|zak|🧊',
  ],
  dranken: [
    'Koffiebonen|pak|☕', 'Gemalen koffie|pak|☕', 'Koffiepads|pak|☕',
    'Koffiecups|doos|☕', 'Thee|doos|🍵', 'Groene thee|doos|🍵', 'Kruidenthee|doos|🍵',
    'Sinaasappelsap|pak|🧃', 'Appelsap|pak|🧃', 'Multivruchtensap|pak|🧃',
    'Cola|fles|🥤', 'Cola zero|fles|🥤', 'Sinas|fles|🥤', 'Cassis|fles|🥤',
    'Spa blauw|fles|💧', 'Spa rood|fles|💧', 'Bruisend water|fles|💧',
    'Ranja|fles|🧃', 'IJsthee|fles|🧊', 'Bier|krat|🍺', 'Speciaalbier|fles|🍺',
    'Alcoholvrij bier|pak|🍺', 'Rode wijn|fles|🍷', 'Witte wijn|fles|🍷',
    'Rosé|fles|🍷', 'Prosecco|fles|🍾', 'Energy drink|blik|⚡',
  ],
  'snoep-snacks': [
    'Chips naturel|zak|🥔', 'Chips paprika|zak|🥔', 'Nachos|zak|🌮', 'Zoutjes|zak|🥨',
    'Borrelnootjes|zak|🥜', 'Popcorn|zak|🍿', 'Chocolade reep|reep|🍫',
    'Melkchocolade|reep|🍫', 'Pure chocolade|reep|🍫', 'M&Ms|zak|🍬', 'Drop|zak|🍬',
    'Winegums|zak|🍬', 'Snoepmix|zak|🍬', 'Pepermunt|rol|🍬', 'Kauwgom|pak|🍬',
    'Koeken|pak|🍪', 'Chocoladekoekjes|pak|🍪', 'Speculaas|pak|🍪', 'Tortillachips|zak|🌮',
    'Salsadip|pot|🌶️', 'Guacamole|bak|🥑', 'Hummus|bak|🫘', 'Tzatziki|bak|🥒',
  ],
  huishouden: [
    'Afwasmiddel|fles|🧴', 'Vaatwastabletten|doos|🧼', 'Vaatwasglansspoelmiddel|fles|🧴',
    'Wasmiddel|fles|🧺', 'Wasverzachter|fles|🧺', 'Vlekverwijderaar|fles|🧴',
    'Allesreiniger|fles|🧽', 'Glasreiniger|fles|🧽', 'Toiletreiniger|fles|🚽',
    'Badkamerreiniger|fles|🛁', 'Ontkalker|fles|🧴', 'Schuursponsjes|pak|🧽',
    'Vaatdoekjes|pak|🧽', 'Keukenpapier|rol|🧻', 'Toiletpapier|pak|🧻',
    'Vuilniszakken|rol|🗑️', 'Diepvrieszakjes|pak|🧊', 'Luchtverfrisser|spuitbus|🌸',
    'Batterijen AA|pak|🔋', 'Batterijen AAA|pak|🔋', 'Kaarsen|pak|🕯️',
    'Wc-blokjes|pak|🚽', 'Afwasborstel|stuk|🧽',
  ],
  verzorging: [
    'Shampoo|fles|🧴', 'Conditioner|fles|🧴', 'Douchegel|fles|🧴', 'Handzeep|fles|🧼',
    'Tandpasta|tube|🪥', 'Tandenborstel|stuk|🪥', 'Mondwater|fles|🦷', 'Flosdraad|pak|🦷',
    'Deodorant|spuitbus|🧴', 'Bodylotion|fles|🧴', 'Handcrème|tube|🧴',
    'Gezichtscrème|pot|🧴', 'Zonnebrand|fles|☀️', 'Scheermesjes|pak|🪒',
    'Scheerschuim|bus|🪒', 'Maandverband|pak|🩸', 'Tampons|pak|🩸',
    'Wattenschijfjes|pak|🧻', 'Wattenstaafjes|pak|🧻', 'Paracetamol|doos|💊',
    'Ibuprofen|doos|💊', 'Pleisters|doos|🩹', 'Vitamine D|potje|💊', 'Multivitamine|potje|💊',
    'Zakdoekjes|pak|🤧', 'Lippenbalsem|stuk|💄',
  ],
  baby: [
    'Luiers|pak|🍼', 'Babydoekjes|pak|🍼', 'Babyvoeding|potje|🍼', 'Flesvoeding|pak|🍼',
    'Babyshampoo|fles|🍼', 'Billendoekjes|pak|🍼', 'Babymelk|pak|🍼', 'Fruithapje|knijpzak|🍼',
  ],
  huisdier: [
    'Kattenvoer nat|doos|🐱', 'Kattenvoer droog|zak|🐱', 'Kattenbakvulling|zak|🐱',
    'Kattensnoepjes|zak|🐱', 'Hondenvoer nat|doos|🐶', 'Hondenvoer droog|zak|🐶',
    'Hondensnacks|zak|🐶', 'Vogelvoer|zak|🐦',
  ],
  overig: [
    'Cadeaupapier|rol|🎁', 'Verjaardagskaart|stuk|💌', 'Bloemen|bos|💐',
    'Postzegels|vel|📮', 'Pennen|pak|🖊️', 'Notitieblok|stuk|📓',
  ],
};

/** U+0300–U+036F: the diacritics NFD splits off (é → e + ́). */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const CATALOG: CatalogItem[] = Object.entries(RAW).flatMap(([category, rows]) =>
  rows.map((row) => {
    const [name, unit, emoji] = row.split('|');
    return {
      id: `${category}:${slug(name)}`,
      name,
      category: category as CategoryId,
      unit,
      emoji,
    };
  }),
);

export const CATALOG_BY_ID = new Map(CATALOG.map((i) => [i.id, i]));
