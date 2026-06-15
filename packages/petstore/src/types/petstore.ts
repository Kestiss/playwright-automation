export type PetStatus = 'available' | 'pending' | 'sold';
export type OrderStatus = 'placed' | 'approved' | 'delivered';

export interface Category {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Pet {
  id: number;
  category: Category;
  name: string;
  photoUrls: string[];
  tags: Tag[];
  status: PetStatus;
}

export interface Order {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
  complete: boolean;
}
