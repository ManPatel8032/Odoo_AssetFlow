export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string;
          name: string;
          tag: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
}
