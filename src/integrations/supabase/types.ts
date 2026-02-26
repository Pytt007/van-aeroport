export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            addresses: {
                Row: {
                    address: string
                    created_at: string | null
                    id: string
                    label: string
                    type: string
                    user_id: string | null
                }
                Insert: {
                    address: string
                    created_at?: string | null
                    id?: string
                    label: string
                    type?: string
                    user_id?: string | null
                }
                Update: {
                    address?: string
                    created_at?: string | null
                    id?: string
                    label?: string
                    type?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    created_at: string | null
                    destination: string
                    id: string
                    pickup_date: string
                    pickup_time: string
                    return_date: string | null
                    return_time: string | null
                    status: string
                    travelers: number
                    user_id: string | null
                    vehicle_name: string
                }
                Insert: {
                    created_at?: string | null
                    destination: string
                    id?: string
                    pickup_date: string
                    pickup_time: string
                    return_date?: string | null
                    return_time?: string | null
                    status?: string
                    travelers?: number
                    user_id?: string | null
                    vehicle_name: string
                }
                Update: {
                    created_at?: string | null
                    destination?: string
                    id?: string
                    pickup_date?: string
                    pickup_time?: string
                    return_date?: string | null
                    return_time?: string | null
                    status?: string
                    travelers?: number
                    user_id?: string | null
                    vehicle_name?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    phone: string | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            vehicles: {
                Row: {
                    id: string
                    name: string
                    category: string
                    image_url: string
                    rating: number | null
                    speed: string | null
                    seats: string | null
                    engine: string | null
                    is_available: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: string
                    image_url: string
                    rating?: number | null
                    speed?: string | null
                    seats?: string | null
                    engine?: string | null
                    is_available?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    image_url?: string
                    rating?: number | null
                    speed?: string | null
                    seats?: string | null
                    engine?: string | null
                    is_available?: boolean | null
                    created_at?: string
                }
                Relationships: []
            }
            app_settings: {
                Row: {
                    key: string
                    value: Json
                    description: string | null
                    updated_at: string
                }
                Insert: {
                    key: string
                    value: Json
                    description?: string | null
                    updated_at?: string
                }
                Update: {
                    key?: string
                    value?: Json
                    description?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            zone_pricing: {
                Row: {
                    zone_letter: string
                    price: number
                }
                Insert: {
                    zone_letter: string
                    price: number
                }
                Update: {
                    zone_letter?: string
                    price?: number
                }
                Relationships: []
            }
            communes: {
                Row: {
                    id: string
                    name: string
                    zone_letter: string | null
                    airport_price: number | null
                    is_active: boolean | null
                    display_order: number | null
                }
                Insert: {
                    id?: string
                    name: string
                    zone_letter?: string | null
                    airport_price?: number | null
                    is_active?: boolean | null
                    display_order?: number | null
                }
                Update: {
                    id?: string
                    name?: string
                    zone_letter?: string | null
                    airport_price?: number | null
                    is_active?: boolean | null
                    display_order?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "communes_zone_letter_fkey"
                        columns: ["zone_letter"]
                        isOneToOne: false
                        referencedRelation: "zone_pricing"
                        referencedColumns: ["zone_letter"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
