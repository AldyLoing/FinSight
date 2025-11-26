export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id?: string | null;
  color?: string;
  icon?: string;
  is_income: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CategoryInput {
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_income?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}
