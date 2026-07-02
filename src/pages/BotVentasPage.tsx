import { useState } from "react";
import { Bot, MessageSquare } from "lucide-react";

interface Mensaje {
  tipo: "bot" | "user";
  texto: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  marca: string;
}

const PRODUCTOS: Producto[] = [
  {"id":"p001","nombre":"Lancôme Trésor EDP 100ml","precio":66500,"stock":5,"categoria":"Dama","marca":"Lancôme"},
  {"id":"p002","nombre":"Lancôme La Vie Est Belle EDP 75ml","precio":58500,"stock":8,"categoria":"Dama","marca":"Lancôme"},
  {"id":"p003","nombre":"Lancôme Idôle EDP 75ml","precio":52000,"stock":6,"categoria":"Dama","marca":"Lancôme"},
  {"id":"p004","nombre":"Lancôme Hypnôse EDP 75ml","precio":49500,"stock":4,"categoria":"Dama","marca":"Lancôme"},
  {"id":"p005","nombre":"Lancôme Miracle EDP 100ml","precio":47500,"stock":7,"categoria":"Dama","marca":"Lancôme"},
  {"id":"p006","nombre":"Chanel N°5 EDP 100ml","precio":89000,"stock":3,"categoria":"Dama","marca":"Chanel"},
  {"id":"p007","nombre":"Chanel Coco Mademoiselle EDP 100ml","precio":85000,"stock":5,"categoria":"Dama","marca":"Chanel"},
  {"id":"p008","nombre":"Chanel Chance Eau Tendre EDT 100ml","precio":78000,"stock":6,"categoria":"Dama","marca":"Chanel"},
  {"id":"p009","nombre":"Chanel Gabrielle EDP 100ml","precio":82000,"stock":4,"categoria":"Dama","marca":"Chanel"},
  {"id":"p010","nombre":"Chanel Allure EDP 100ml","precio":76000,"stock":5,"categoria":"Dama","marca":"Chanel"},
  {"id":"p011","nombre":"Dior Jadore EDP 100ml","precio":72000,"stock":7,"categoria":"Dama","marca":"Dior"},
  {"id":"p012","nombre":"Dior Miss Dior EDP 100ml","precio":68000,"stock":8,"categoria":"Dama","marca":"Dior"},
  {"id":"p013","nombre":"Dior Poison Girl EDP 100ml","precio":65000,"stock":5,"categoria":"Dama","marca":"Dior"},
  {"id":"p014","nombre":"Dior Joy EDP 90ml","precio":62000,"stock":6,"categoria":"Dama","marca":"Dior"},
  {"id":"p015","nombre":"Dior Fahrenheit EDT 100ml","precio":58000,"stock":9,"categoria":"Caballero","marca":"Dior"},
  {"id":"p016","nombre":"Dior Sauvage EDT 100ml","precio":75000,"stock":10,"categoria":"Caballero","marca":"Dior"},
  {"id":"p017","nombre":"Dior Homme Intense EDP 100ml","precio":70000,"stock":6,"categoria":"Caballero","marca":"Dior"},
  {"id":"p018","nombre":"Dior Dior Homme Sport EDT 100ml","precio":65000,"stock":8,"categoria":"Caballero","marca":"Dior"},
  {"id":"p019","nombre":"Paco Rabanne Lady Million EDP 80ml","precio":55000,"stock":7,"categoria":"Dama","marca":"Paco Rabanne"},
  {"id":"p020","nombre":"Paco Rabanne Olympea EDP 80ml","precio":52000,"stock":6,"categoria":"Dama","marca":"Paco Rabanne"},
  {"id":"p021","nombre":"Paco Rabanne 1 Million EDT 100ml","precio":48000,"stock":12,"categoria":"Caballero","marca":"Paco Rabanne"},
  {"id":"p022","nombre":"Paco Rabanne Invictus EDT 100ml","precio":46000,"stock":10,"categoria":"Caballero","marca":"Paco Rabanne"},
  {"id":"p023","nombre":"Paco Rabanne Pure XS EDT 100ml","precio":44000,"stock":8,"categoria":"Caballero","marca":"Paco Rabanne"},
  {"id":"p024","nombre":"Carolina Herrera Good Girl EDP 80ml","precio":62000,"stock":7,"categoria":"Dama","marca":"Carolina Herrera"},
  {"id":"p025","nombre":"Carolina Herrera 212 VIP EDP 80ml","precio":58000,"stock":6,"categoria":"Dama","marca":"Carolina Herrera"},
  {"id":"p026","nombre":"Carolina Herrera CH Men EDT 100ml","precio":52000,"stock":9,"categoria":"Caballero","marca":"Carolina Herrera"},
  {"id":"p027","nombre":"Carolina Herrera 212 Men EDT 100ml","precio":48000,"stock":11,"categoria":"Caballero","marca":"Carolina Herrera"},
  {"id":"p028","nombre":"Carolina Herrera Bad Boy EDT 100ml","precio":50000,"stock":8,"categoria":"Caballero","marca":"Carolina Herrera"},
  {"id":"p029","nombre":"Versace Bright Crystal EDT 90ml","precio":42000,"stock":10,"categoria":"Dama","marca":"Versace"},
  {"id":"p030","nombre":"Versace Crystal Noir EDP 90ml","precio":45000,"stock":7,"categoria":"Dama","marca":"Versace"},
  {"id":"p031","nombre":"Versace Yellow Diamond EDT 90ml","precio":40000,"stock":9,"categoria":"Dama","marca":"Versace"},
  {"id":"p032","nombre":"Versace Eros EDT 100ml","precio":38000,"stock":15,"categoria":"Caballero","marca":"Versace"},
  {"id":"p033","nombre":"Versace Dylan Blue EDT 100ml","precio":42000,"stock":12,"categoria":"Caballero","marca":"Versace"},
  {"id":"p034","nombre":"Versace Pour Homme EDT 100ml","precio":35000,"stock":14,"categoria":"Caballero","marca":"Versace"},
  {"id":"p035","nombre":"Versace Man Eau Fraiche EDT 100ml","precio":36000,"stock":13,"categoria":"Caballero","marca":"Versace"},
  {"id":"p036","nombre":"Calvin Klein CK One EDT 200ml","precio":32000,"stock":20,"categoria":"Unisex","marca":"Calvin Klein"},
  {"id":"p037","nombre":"Calvin Klein Eternity EDP 100ml","precio":38000,"stock":10,"categoria":"Dama","marca":"Calvin Klein"},
  {"id":"p038","nombre":"Calvin Klein Euphoria EDP 100ml","precio":42000,"stock":8,"categoria":"Dama","marca":"Calvin Klein"},
  {"id":"p039","nombre":"Calvin Klein Obsession EDP 100ml","precio":40000,"stock":9,"categoria":"Dama","marca":"Calvin Klein"},
  {"id":"p040","nombre":"Calvin Klein Defy EDT 100ml","precio":35000,"stock":11,"categoria":"Caballero","marca":"Calvin Klein"},
  {"id":"p041","nombre":"Hugo Boss Boss Bottled EDT 100ml","precio":45000,"stock":12,"categoria":"Caballero","marca":"Hugo Boss"},
  {"id":"p042","nombre":"Hugo Boss The Scent EDT 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Hugo Boss"},
  {"id":"p043","nombre":"Hugo Boss Boss Femme EDP 75ml","precio":42000,"stock":8,"categoria":"Dama","marca":"Hugo Boss"},
  {"id":"p044","nombre":"Hugo Boss Deep Red EDP 90ml","precio":40000,"stock":7,"categoria":"Dama","marca":"Hugo Boss"},
  {"id":"p045","nombre":"Hugo Boss Hugo Man EDT 125ml","precio":38000,"stock":14,"categoria":"Caballero","marca":"Hugo Boss"},
  {"id":"p046","nombre":"Armani Si EDP 100ml","precio":62000,"stock":6,"categoria":"Dama","marca":"Armani"},
  {"id":"p047","nombre":"Armani My Way EDP 90ml","precio":58000,"stock":7,"categoria":"Dama","marca":"Armani"},
  {"id":"p048","nombre":"Armani Code Femme EDP 75ml","precio":55000,"stock":5,"categoria":"Dama","marca":"Armani"},
  {"id":"p049","nombre":"Armani Acqua di Gio EDT 100ml","precio":52000,"stock":13,"categoria":"Caballero","marca":"Armani"},
  {"id":"p050","nombre":"Armani Code EDT 125ml","precio":58000,"stock":11,"categoria":"Caballero","marca":"Armani"},
  {"id":"p051","nombre":"Armani Stronger With You EDT 100ml","precio":50000,"stock":9,"categoria":"Caballero","marca":"Armani"},
  {"id":"p052","nombre":"YSL Mon Paris EDP 90ml","precio":65000,"stock":6,"categoria":"Dama","marca":"YSL"},
  {"id":"p053","nombre":"YSL Black Opium EDP 90ml","precio":68000,"stock":5,"categoria":"Dama","marca":"YSL"},
  {"id":"p054","nombre":"YSL Libre EDP 90ml","precio":62000,"stock":7,"categoria":"Dama","marca":"YSL"},
  {"id":"p055","nombre":"YSL LHomme EDT 100ml","precio":55000,"stock":10,"categoria":"Caballero","marca":"YSL"},
  {"id":"p056","nombre":"YSL La Nuit de LHomme EDT 100ml","precio":58000,"stock":8,"categoria":"Caballero","marca":"YSL"},
  {"id":"p057","nombre":"YSL Y EDT 100ml","precio":52000,"stock":12,"categoria":"Caballero","marca":"YSL"},
  {"id":"p058","nombre":"Gucci Bloom EDP 100ml","precio":58000,"stock":7,"categoria":"Dama","marca":"Gucci"},
  {"id":"p059","nombre":"Gucci Guilty EDP 90ml","precio":52000,"stock":8,"categoria":"Dama","marca":"Gucci"},
  {"id":"p060","nombre":"Gucci Flora EDT 100ml","precio":48000,"stock":9,"categoria":"Dama","marca":"Gucci"},
  {"id":"p061","nombre":"Gucci Guilty Pour Homme EDT 90ml","precio":46000,"stock":11,"categoria":"Caballero","marca":"Gucci"},
  {"id":"p062","nombre":"Gucci By Gucci Pour Homme EDT 90ml","precio":44000,"stock":10,"categoria":"Caballero","marca":"Gucci"},
  {"id":"p063","nombre":"Burberry Her EDP 100ml","precio":52000,"stock":7,"categoria":"Dama","marca":"Burberry"},
  {"id":"p064","nombre":"Burberry Brit Sheer EDT 100ml","precio":45000,"stock":9,"categoria":"Dama","marca":"Burberry"},
  {"id":"p065","nombre":"Burberry My Burberry EDP 90ml","precio":55000,"stock":6,"categoria":"Dama","marca":"Burberry"},
  {"id":"p066","nombre":"Burberry London EDT 100ml","precio":42000,"stock":12,"categoria":"Caballero","marca":"Burberry"},
  {"id":"p067","nombre":"Burberry Hero EDT 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Burberry"},
  {"id":"p068","nombre":"Burberry Touch EDT 100ml","precio":40000,"stock":11,"categoria":"Caballero","marca":"Burberry"},
  {"id":"p069","nombre":"Jean Paul Gaultier Scandal EDP 80ml","precio":55000,"stock":6,"categoria":"Dama","marca":"Jean Paul Gaultier"},
  {"id":"p070","nombre":"Jean Paul Gaultier La Belle EDP 100ml","precio":52000,"stock":7,"categoria":"Dama","marca":"Jean Paul Gaultier"},
  {"id":"p071","nombre":"Jean Paul Gaultier Le Male EDT 125ml","precio":48000,"stock":14,"categoria":"Caballero","marca":"Jean Paul Gaultier"},
  {"id":"p072","nombre":"Jean Paul Gaultier Ultra Male EDT 125ml","precio":50000,"stock":12,"categoria":"Caballero","marca":"Jean Paul Gaultier"},
  {"id":"p073","nombre":"Jean Paul Gaultier Scandal Pour Homme EDT 100ml","precio":46000,"stock":10,"categoria":"Caballero","marca":"Jean Paul Gaultier"},
  {"id":"p074","nombre":"Nina Ricci Nina EDP 80ml","precio":42000,"stock":8,"categoria":"Dama","marca":"Nina Ricci"},
  {"id":"p075","nombre":"Nina Ricci LExtase EDP 80ml","precio":45000,"stock":7,"categoria":"Dama","marca":"Nina Ricci"},
  {"id":"p076","nombre":"Nina Ricci Luna EDT 80ml","precio":40000,"stock":9,"categoria":"Dama","marca":"Nina Ricci"},
  {"id":"p077","nombre":"Givenchy LInterdit EDP 80ml","precio":62000,"stock":5,"categoria":"Dama","marca":"Givenchy"},
  {"id":"p078","nombre":"Givenchy Very Irresistible EDP 75ml","precio":52000,"stock":7,"categoria":"Dama","marca":"Givenchy"},
  {"id":"p079","nombre":"Givenchy Dahlia Divin EDP 75ml","precio":55000,"stock":6,"categoria":"Dama","marca":"Givenchy"},
  {"id":"p080","nombre":"Givenchy Gentleman EDT 100ml","precio":50000,"stock":10,"categoria":"Caballero","marca":"Givenchy"},
  {"id":"p081","nombre":"Givenchy Gentleman Reserve Privee EDP 100ml","precio":58000,"stock":8,"categoria":"Caballero","marca":"Givenchy"},
  {"id":"p082","nombre":"Givenchy Pi EDT 100ml","precio":45000,"stock":9,"categoria":"Caballero","marca":"Givenchy"},
  {"id":"p083","nombre":"Thierry Mugler Alien EDP 90ml","precio":58000,"stock":6,"categoria":"Dama","marca":"Thierry Mugler"},
  {"id":"p084","nombre":"Thierry Mugler Angel EDP 50ml","precio":52000,"stock":7,"categoria":"Dama","marca":"Thierry Mugler"},
  {"id":"p085","nombre":"Thierry Mugler Alien Goddess EDP 90ml","precio":62000,"stock":5,"categoria":"Dama","marca":"Thierry Mugler"},
  {"id":"p086","nombre":"Thierry Mugler A Men EDT 100ml","precio":48000,"stock":11,"categoria":"Caballero","marca":"Thierry Mugler"},
  {"id":"p087","nombre":"Thierry Mugler Alien Man EDT 100ml","precio":50000,"stock":9,"categoria":"Caballero","marca":"Thierry Mugler"},
  {"id":"p088","nombre":"Bvlgari Omnia Crystalline EDT 65ml","precio":45000,"stock":8,"categoria":"Dama","marca":"Bvlgari"},
  {"id":"p089","nombre":"Bvlgari Goldea EDP 90ml","precio":55000,"stock":6,"categoria":"Dama","marca":"Bvlgari"},
  {"id":"p090","nombre":"Bvlgari Rose Goldea EDP 90ml","precio":58000,"stock":5,"categoria":"Dama","marca":"Bvlgari"},
  {"id":"p091","nombre":"Bvlgari Aqva Pour Homme EDT 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Bvlgari"},
  {"id":"p092","nombre":"Bvlgari Man in Black EDP 100ml","precio":52000,"stock":8,"categoria":"Caballero","marca":"Bvlgari"},
  {"id":"p093","nombre":"Bvlgari Wood Neroli EDP 100ml","precio":46000,"stock":9,"categoria":"Caballero","marca":"Bvlgari"},
  {"id":"p094","nombre":"Dolce Gabbana Light Blue EDT 100ml","precio":52000,"stock":12,"categoria":"Dama","marca":"Dolce Gabbana"},
  {"id":"p095","nombre":"Dolce Gabbana The Only One EDP 100ml","precio":58000,"stock":7,"categoria":"Dama","marca":"Dolce Gabbana"},
  {"id":"p096","nombre":"Dolce Gabbana Dolce EDP 75ml","precio":48000,"stock":8,"categoria":"Dama","marca":"Dolce Gabbana"},
  {"id":"p097","nombre":"Dolce Gabbana Pour Homme EDT 125ml","precio":45000,"stock":14,"categoria":"Caballero","marca":"Dolce Gabbana"},
  {"id":"p098","nombre":"Dolce Gabbana Light Blue Pour Homme EDT 125ml","precio":48000,"stock":11,"categoria":"Caballero","marca":"Dolce Gabbana"},
  {"id":"p099","nombre":"Dolce Gabbana K EDT 100ml","precio":50000,"stock":10,"categoria":"Caballero","marca":"Dolce Gabbana"},
  {"id":"p100","nombre":"Marc Jacobs Daisy EDT 100ml","precio":48000,"stock":9,"categoria":"Dama","marca":"Marc Jacobs"},
  {"id":"p101","nombre":"Marc Jacobs Daisy Love EDT 100ml","precio":50000,"stock":8,"categoria":"Dama","marca":"Marc Jacobs"},
  {"id":"p102","nombre":"Marc Jacobs Perfect EDP 100ml","precio":52000,"stock":7,"categoria":"Dama","marca":"Marc Jacobs"},
  {"id":"p103","nombre":"Marc Jacobs Decadence EDP 100ml","precio":55000,"stock":6,"categoria":"Dama","marca":"Marc Jacobs"},
  {"id":"p104","nombre":"Marc Jacobs Men EDT 125ml","precio":42000,"stock":10,"categoria":"Caballero","marca":"Marc Jacobs"},
  {"id":"p105","nombre":"Ralph Lauren Ralph EDT 100ml","precio":40000,"stock":11,"categoria":"Dama","marca":"Ralph Lauren"},
  {"id":"p106","nombre":"Ralph Lauren Romance EDP 100ml","precio":52000,"stock":8,"categoria":"Dama","marca":"Ralph Lauren"},
  {"id":"p107","nombre":"Ralph Lauren Woman EDP 100ml","precio":58000,"stock":6,"categoria":"Dama","marca":"Ralph Lauren"},
  {"id":"p108","nombre":"Ralph Lauren Polo Blue EDT 125ml","precio":48000,"stock":12,"categoria":"Caballero","marca":"Ralph Lauren"},
  {"id":"p109","nombre":"Ralph Lauren Polo Red EDT 125ml","precio":50000,"stock":10,"categoria":"Caballero","marca":"Ralph Lauren"},
  {"id":"p110","nombre":"Ralph Lauren Polo Green EDT 118ml","precio":46000,"stock":11,"categoria":"Caballero","marca":"Ralph Lauren"},
  {"id":"p111","nombre":"Tom Ford Black Orchid EDP 100ml","precio":85000,"stock":4,"categoria":"Dama","marca":"Tom Ford"},
  {"id":"p112","nombre":"Tom Ford Lost Cherry EDP 100ml","precio":95000,"stock":3,"categoria":"Unisex","marca":"Tom Ford"},
  {"id":"p113","nombre":"Tom Ford Tobacco Vanille EDP 100ml","precio":90000,"stock":4,"categoria":"Unisex","marca":"Tom Ford"},
  {"id":"p114","nombre":"Tom Ford Oud Wood EDP 100ml","precio":88000,"stock":5,"categoria":"Unisex","marca":"Tom Ford"},
  {"id":"p115","nombre":"Tom Ford Noir Extreme EDP 100ml","precio":82000,"stock":6,"categoria":"Caballero","marca":"Tom Ford"},
  {"id":"p116","nombre":"Jo Malone London Peony Blush Suede 100ml","precio":65000,"stock":7,"categoria":"Dama","marca":"Jo Malone"},
  {"id":"p117","nombre":"Jo Malone London English Pear Freesia 100ml","precio":62000,"stock":8,"categoria":"Dama","marca":"Jo Malone"},
  {"id":"p118","nombre":"Jo Malone London Wood Sage Sea Salt 100ml","precio":60000,"stock":9,"categoria":"Unisex","marca":"Jo Malone"},
  {"id":"p119","nombre":"Jo Malone London Lime Basil Mandarin 100ml","precio":58000,"stock":10,"categoria":"Unisex","marca":"Jo Malone"},
  {"id":"p120","nombre":"Jo Malone London Pomegranate Noir 100ml","precio":61000,"stock":8,"categoria":"Unisex","marca":"Jo Malone"},
  {"id":"p121","nombre":"Prada Candy EDP 80ml","precio":52000,"stock":9,"categoria":"Dama","marca":"Prada"},
  {"id":"p122","nombre":"Prada La Femme EDP 100ml","precio":58000,"stock":7,"categoria":"Dama","marca":"Prada"},
  {"id":"p123","nombre":"Prada LHomme EDT 100ml","precio":55000,"stock":10,"categoria":"Caballero","marca":"Prada"},
  {"id":"p124","nombre":"Prada Luna Rossa EDT 100ml","precio":48000,"stock":12,"categoria":"Caballero","marca":"Prada"},
  {"id":"p125","nombre":"Prada Amber Pour Homme EDT 100ml","precio":50000,"stock":11,"categoria":"Caballero","marca":"Prada"},
  {"id":"p126","nombre":"Valentino Donna Born In Roma EDP 100ml","precio":62000,"stock":7,"categoria":"Dama","marca":"Valentino"},
  {"id":"p127","nombre":"Valentino Voce Viva EDP 100ml","precio":58000,"stock":8,"categoria":"Dama","marca":"Valentino"},
  {"id":"p128","nombre":"Valentino Uomo EDT 100ml","precio":52000,"stock":10,"categoria":"Caballero","marca":"Valentino"},
  {"id":"p129","nombre":"Valentino Uomo Born In Roma EDT 100ml","precio":55000,"stock":9,"categoria":"Caballero","marca":"Valentino"},
  {"id":"p130","nombre":"Valentino Uomo Intense EDP 100ml","precio":58000,"stock":8,"categoria":"Caballero","marca":"Valentino"},
  {"id":"p131","nombre":"Loewe 001 Woman EDP 100ml","precio":55000,"stock":7,"categoria":"Dama","marca":"Loewe"},
  {"id":"p132","nombre":"Loewe 001 Man EDT 100ml","precio":52000,"stock":9,"categoria":"Caballero","marca":"Loewe"},
  {"id":"p133","nombre":"Loewe Aura Floral EDP 100ml","precio":48000,"stock":8,"categoria":"Dama","marca":"Loewe"},
  {"id":"p134","nombre":"Loewe Solo Loewe EDT 125ml","precio":50000,"stock":10,"categoria":"Caballero","marca":"Loewe"},
  {"id":"p135","nombre":"Loewe 7 EDT 100ml","precio":46000,"stock":11,"categoria":"Caballero","marca":"Loewe"},
  {"id":"p136","nombre":"Kenzo Flower EDP 100ml","precio":45000,"stock":9,"categoria":"Dama","marca":"Kenzo"},
  {"id":"p137","nombre":"Kenzo World EDP 75ml","precio":48000,"stock":8,"categoria":"Dama","marca":"Kenzo"},
  {"id":"p138","nombre":"Kenzo Jeu dAmour EDP 100ml","precio":42000,"stock":10,"categoria":"Dama","marca":"Kenzo"},
  {"id":"p139","nombre":"Kenzo Homme EDT 100ml","precio":40000,"stock":12,"categoria":"Caballero","marca":"Kenzo"},
  {"id":"p140","nombre":"Kenzo L'Eau par Kenzo EDT 100ml","precio":38000,"stock":14,"categoria":"Caballero","marca":"Kenzo"},
  {"id":"p141","nombre":"Issey Miyake L'Eau d'Issey EDT 100ml","precio":42000,"stock":11,"categoria":"Dama","marca":"Issey Miyake"},
  {"id":"p142","nombre":"Issey Miyake L'Eau d'Issey Absolue EDP 90ml","precio":48000,"stock":8,"categoria":"Dama","marca":"Issey Miyake"},
  {"id":"p143","nombre":"Issey Miyake L'Eau d'Issey Pour Homme EDT 125ml","precio":45000,"stock":13,"categoria":"Caballero","marca":"Issey Miyake"},
  {"id":"p144","nombre":"Issey Miyake Nuit d'Issey EDT 125ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Issey Miyake"},
  {"id":"p145","nombre":"Issey Miyake Fusion d'Issey EDT 100ml","precio":44000,"stock":9,"categoria":"Caballero","marca":"Issey Miyake"},
  {"id":"p146","nombre":"Escada Especially EDP 75ml","precio":38000,"stock":10,"categoria":"Dama","marca":"Escada"},
  {"id":"p147","nombre":"Escada Joyful EDP 75ml","precio":40000,"stock":9,"categoria":"Dama","marca":"Escada"},
  {"id":"p148","nombre":"Escada Sorbetto Rosso EDT 100ml","precio":35000,"stock":12,"categoria":"Dama","marca":"Escada"},
  {"id":"p149","nombre":"Escada Magnetism EDP 75ml","precio":42000,"stock":8,"categoria":"Dama","marca":"Escada"},
  {"id":"p150","nombre":"Escada Turquoise Summer EDT 100ml","precio":36000,"stock":11,"categoria":"Dama","marca":"Escada"},
  {"id":"p151","nombre":"Davidoff Cool Water Woman EDT 100ml","precio":32000,"stock":15,"categoria":"Dama","marca":"Davidoff"},
  {"id":"p152","nombre":"Davidoff Cool Water EDT 125ml","precio":28000,"stock":18,"categoria":"Caballero","marca":"Davidoff"},
  {"id":"p153","nombre":"Davidoff Champion EDT 90ml","precio":35000,"stock":10,"categoria":"Caballero","marca":"Davidoff"},
  {"id":"p154","nombre":"Davidoff The Game EDT 100ml","precio":38000,"stock":9,"categoria":"Caballero","marca":"Davidoff"},
  {"id":"p155","nombre":"Davidoff Horizon EDT 125ml","precio":34000,"stock":11,"categoria":"Caballero","marca":"Davidoff"},
  {"id":"p156","nombre":"Moschino Toy 2 EDP 100ml","precio":42000,"stock":10,"categoria":"Dama","marca":"Moschino"},
  {"id":"p157","nombre":"Moschino Fresh Couture EDT 100ml","precio":38000,"stock":12,"categoria":"Dama","marca":"Moschino"},
  {"id":"p158","nombre":"Moschino Gold Fresh Couture EDP 100ml","precio":40000,"stock":9,"categoria":"Dama","marca":"Moschino"},
  {"id":"p159","nombre":"Moschino Forever Sailing EDT 100ml","precio":36000,"stock":11,"categoria":"Caballero","marca":"Moschino"},
  {"id":"p160","nombre":"Moschino Uomo EDT 125ml","precio":34000,"stock":13,"categoria":"Caballero","marca":"Moschino"},
  {"id":"p161","nombre":"Azzaro Wanted EDT 100ml","precio":45000,"stock":12,"categoria":"Caballero","marca":"Azzaro"},
  {"id":"p162","nombre":"Azzaro Wanted By Night EDP 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Azzaro"},
  {"id":"p163","nombre":"Azzaro Pour Homme EDT 100ml","precio":42000,"stock":11,"categoria":"Caballero","marca":"Azzaro"},
  {"id":"p164","nombre":"Azzaro Chrome EDT 100ml","precio":40000,"stock":14,"categoria":"Caballero","marca":"Azzaro"},
  {"id":"p165","nombre":"Azzaro Chrome Pure EDT 100ml","precio":42000,"stock":12,"categoria":"Caballero","marca":"Azzaro"},
  {"id":"p166","nombre":"Montblanc Legend EDT 100ml","precio":44000,"stock":13,"categoria":"Caballero","marca":"Montblanc"},
  {"id":"p167","nombre":"Montblanc Legend Spirit EDT 100ml","precio":42000,"stock":11,"categoria":"Caballero","marca":"Montblanc"},
  {"id":"p168","nombre":"Montblanc Explorer EDP 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Montblanc"},
  {"id":"p169","nombre":"Montblanc Legend Night EDP 100ml","precio":46000,"stock":9,"categoria":"Caballero","marca":"Montblanc"},
  {"id":"p170","nombre":"Montblanc Emblem EDT 100ml","precio":40000,"stock":12,"categoria":"Caballero","marca":"Montblanc"},
  {"id":"p171","nombre":"Salvatore Ferragamo Signorina EDP 100ml","precio":48000,"stock":9,"categoria":"Dama","marca":"Salvatore Ferragamo"},
  {"id":"p172","nombre":"Salvatore Ferragamo Amo Ferragamo EDP 100ml","precio":50000,"stock":8,"categoria":"Dama","marca":"Salvatore Ferragamo"},
  {"id":"p173","nombre":"Salvatore Ferragamo Uomo EDT 100ml","precio":45000,"stock":11,"categoria":"Caballero","marca":"Salvatore Ferragamo"},
  {"id":"p174","nombre":"Salvatore Ferragamo Uomo Signature EDP 100ml","precio":48000,"stock":10,"categoria":"Caballero","marca":"Salvatore Ferragamo"},
  {"id":"p175","nombre":"Salvatore Ferragamo Acqua Essenziale EDT 100ml","precio":42000,"stock":12,"categoria":"Caballero","marca":"Salvatore Ferragamo"}
];

export default function BotVentasPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: "bot", texto: "¡Hola! Soy tu asistente de ventas. ¿Qué perfume buscas hoy? Puedo recomendarte por categoría, marca o presupuesto." }
  ]);
  const [input, setInput] = useState("");

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const userMsg: Mensaje = { tipo: "user", texto: input };
    setMensajes(prev => [...prev, userMsg]);
    
    const texto = input.toLowerCase();
    let respuesta: Mensaje = { tipo: "bot", texto: "" };
    
    if (texto.includes("hola") || texto.includes("buenos")) {
      respuesta = { tipo: "bot", texto: "¡Bienvenido! ¿Buscas perfume para dama, caballero o unisex? ¿Tienes alguna marca preferida?" };
    } else if (texto.includes("dama") || texto.includes("mujer")) {
      const dama = PRODUCTOS.filter(p => p.categoria === "Dama").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Te recomiendo: ${dama.map(p => p.nombre).join(", ")}` };
    } else if (texto.includes("caballero") || texto.includes("hombre")) {
      const cab = PRODUCTOS.filter(p => p.categoria === "Caballero").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Para caballero: ${cab.map(p => p.nombre).join(", ")}` };
    } else if (texto.includes("barato") || texto.includes("economico")) {
      const baratos = PRODUCTOS.filter(p => p.precio < 40000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Económicos: ${baratos.map(p => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else if (texto.includes("caro") || texto.includes("premium")) {
      const caros = PRODUCTOS.filter(p => p.precio > 70000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Premium: ${caros.map(p => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else {
      const encontrados = PRODUCTOS.filter(p => 
        p.nombre.toLowerCase().includes(texto) || p.marca.toLowerCase().includes(texto)
      ).slice(0, 3);
      if (encontrados.length > 0) {
        respuesta = { tipo: "bot", texto: `Encontré: ${encontrados.map(p => `${p.nombre} - $${p.precio.toLocaleString()}`).join(". ")}` };
      } else {
        respuesta = { tipo: "bot", texto: "Prueba con: 'dama', 'caballero', 'Chanel', 'barato' o 'premium'" };
      }
    }
    
    setTimeout(() => setMensajes(prev => [...prev, respuesta]), 500);
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-teal-600 text-white p-4 rounded-t-xl flex items-center gap-3">
        <Bot size={24} />
        <div>
          <h2 className="font-bold">Bot de Ventas</h2>
          <p className="text-sm opacity-90">Asistente inteligente</p>
        </div>
      </div>
      <div className="bg-white border-x border-b rounded-b-xl p-4 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.tipo === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${m.tipo === "user" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
              <p>{m.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviarMensaje()}
          placeholder="Escribe: 'dama', 'caballero', 'Chanel', 'barato'..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button onClick={enviarMensaje} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}
