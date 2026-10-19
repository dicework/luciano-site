export type MenuTag = 'vegetarian' | 'spicy' | 'popular';
export interface MenuVariant {
  id: string;
  label: string;
  labelEn?: string;
  priceMinor: number;
  available?: boolean;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  nameEn?: string;
  descriptionEn?: string;
  variants: MenuVariant[];
  image?: string;
  tags: MenuTag[];
  available?: boolean;
  featured?: boolean;
}
export interface MenuCategory {
  id: string;
  name: string;
  nameEn?: string;
  descriptionEn?: string;
  description?: string;
  items: MenuItem[];
}
export interface CartLine {
  itemId: string;
  variantId: string;
  quantity: number;
}
export interface ResolvedLine extends CartLine {
  name: string;
  variantLabel: string;
  priceMinor: number;
}
