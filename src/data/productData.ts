import type { Product, Category } from '@/types/product';

let idCounter = 1;
function genId(): string {
  return `prod_${String(idCounter++).padStart(4, '0')}`;
}

function createProduct(
  name: string,
  brand: string,
  category: Category,
  price: number,
  cost: number,
  stock: number,
  minStock: number,
  notes: string,
  description: string
): Product {
  const margin = Math.round(((price - cost) / price) * 100);
  return {
    id: genId(),
    name,
    brand,
    category,
    price,
    cost,
    stock,
    minStock,
    margin,
    notes,
    description,
    image: null,
    createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const seedProducts: Product[] = [
  // === CABALLERO (5) ===
  createProduct('Bleu de Chanel EDP', 'Chanel', 'caballero', 58000, 32000, 3, 2, 'Citrico, Amaderado, Aromatico', 'Eau de Parfum elegante y masculina con notas de citricos, incienso y sandalo.'),
  createProduct('Dior Sauvage', 'Dior', 'caballero', 52000, 28000, 5, 2, 'Citrico, Especiado, Amaderado', 'Fragancia fresca y salvaje con bergamota, pimienta de Sichuan y ambroxan.'),
  createProduct('Acqua di Gio Profondo', 'Giorgio Armani', 'caballero', 42000, 25000, 2, 2, 'Acuatico, Aromatico, Amaderado', 'Fragancia acuatica intensa con notas de mar, cipres y patchouli.'),
  createProduct('1 Million', 'Paco Rabanne', 'caballero', 38000, 20000, 4, 2, 'Dulce, Especiado, Amaderado', 'Fragancia audaz con menta, canela y cuero. Para el hombre que busca destacar.'),
  createProduct('Eros', 'Versace', 'caballero', 35000, 18000, 5, 2, 'Oriental, Amaderado, Fresco', 'Fragancia vibrante con menta, manzana verde y vainilla.'),

  // === DAMA (5) ===
  createProduct('Chanel No. 5 EDP', 'Chanel', 'dama', 62000, 30000, 4, 2, 'Floral, Almizclado, Amaderado', 'El clasico perfume floral-alquimico por excelencia. Notas de rosa, jazmin y sandalo.'),
  createProduct('Coco Mademoiselle EDP', 'Chanel', 'dama', 58000, 29000, 3, 2, 'Oriental, Floral, Amaderado', 'Fragancia moderna y audaz con naranja, rosa y patchouli.'),
  createProduct('La Vie Est Belle', 'Lancôme', 'dama', 48000, 24000, 5, 2, 'Floral, Frutal, Gourmand', 'Fragancia iconica con pera, iris y praliné. La vida es bella.'),
  createProduct('Black Opium EDP', 'Yves Saint Laurent', 'dama', 52000, 27000, 2, 2, 'Oriental, Gourmand, Cafe', 'Fragancia adictiva con cafe, vainilla y flor de azahar.'),
  createProduct('Good Girl', 'Carolina Herrera', 'dama', 46000, 24000, 3, 2, 'Oriental, Floral, Almizclado', 'Fragancia en zapatito de tacón con jazmin, cacao y almizcle.'),

  // === NINOS (2) ===
  createProduct('Baby Touch', 'Burberry', 'ninos', 22000, 11000, 4, 2, 'Floral, Fresco, Almizclado', 'Fragancia suave para bebés con mandarina, flor de azahar y musgo de roble.'),
  createProduct('Petits et Mamans', 'Bvlgari', 'ninos', 24000, 12000, 3, 2, 'Floral, Fresco, Almizclado', 'Fragancia compartida para madres e hijos con petalos de rosa y té blanco.'),

  // === UNISEX (3) ===
  createProduct('Santal 33', 'Le Labo', 'unisex', 72000, 35000, 2, 1, 'Amaderado, Especiado, Cuero', 'Fragancia iconica con sándalo, cedro, especias y cuero. Culto moderno.'),
  createProduct('Baccarat Rouge 540 EDP', 'Maison Francis Kurkdjian', 'unisex', 78000, 38000, 1, 1, 'Oriental, Floral, Amaderado', 'Fragancia legendaria con azafrán, jazmin, ámbar gris y abeto. Obra maestra.'),
  createProduct('CK One', 'Calvin Klein', 'unisex', 22000, 11000, 5, 2, 'Citrico, Aromatica, Fresco', 'Fragancia unisex clasica con limon, pimienta y musgo de roble.'),
];

export const CATEGORIES: { value: Category | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'caballero', label: 'Caballero' },
  { value: 'dama', label: 'Dama' },
  { value: 'ninos', label: 'Niños' },
  { value: 'unisex', label: 'Unisex' },
];