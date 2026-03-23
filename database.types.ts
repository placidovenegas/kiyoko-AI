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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          completed: boolean | null
          conversation_type: string | null
          created_at: string | null
          id: string
          message_count: number | null
          messages: Json
          project_id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
          wizard_step: string | null
        }
        Insert: {
          completed?: boolean | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          messages?: Json
          project_id: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          wizard_step?: string | null
        }
        Update: {
          completed?: boolean | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          messages?: Json
          project_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          wizard_step?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          estimated_cost_usd: number | null
          fallback_reason: string | null
          id: string
          input_tokens: number | null
          model: string
          original_provider: string | null
          output_tokens: number | null
          project_id: string | null
          provider: string
          response_time_ms: number | null
          success: boolean | null
          task: string
          total_tokens: number | null
          user_id: string
          was_fallback: boolean | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          fallback_reason?: string | null
          id?: string
          input_tokens?: number | null
          model: string
          original_provider?: string | null
          output_tokens?: number | null
          project_id?: string | null
          provider: string
          response_time_ms?: number | null
          success?: boolean | null
          task: string
          total_tokens?: number | null
          user_id: string
          was_fallback?: boolean | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          fallback_reason?: string | null
          id?: string
          input_tokens?: number | null
          model?: string
          original_provider?: string | null
          output_tokens?: number | null
          project_id?: string | null
          provider?: string
          response_time_ms?: number | null
          success?: boolean | null
          task?: string
          total_tokens?: number | null
          user_id?: string
          was_fallback?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backgrounds: {
        Row: {
          available_angles: string[] | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          location_type: string | null
          metadata: Json | null
          name: string
          project_id: string
          prompt_snippet: string | null
          reference_image_path: string | null
          reference_image_url: string | null
          sort_order: number | null
          time_of_day: string | null
          updated_at: string | null
          used_in_scenes: string[] | null
        }
        Insert: {
          available_angles?: string[] | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          metadata?: Json | null
          name: string
          project_id: string
          prompt_snippet?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          sort_order?: number | null
          time_of_day?: string | null
          updated_at?: string | null
          used_in_scenes?: string[] | null
        }
        Update: {
          available_angles?: string[] | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          metadata?: Json | null
          name?: string
          project_id?: string
          prompt_snippet?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          sort_order?: number | null
          time_of_day?: string | null
          updated_at?: string | null
          used_in_scenes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "backgrounds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      change_history: {
        Row: {
          action: string
          batch_id: string | null
          created_at: string | null
          description_es: string | null
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          action: string
          batch_id?: string | null
          created_at?: string | null
          description_es?: string | null
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          action?: string
          batch_id?: string | null
          created_at?: string | null
          description_es?: string | null
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          accessories: string[] | null
          ai_notes: string | null
          appears_in_scenes: string[] | null
          color_accent: string | null
          created_at: string | null
          description: string | null
          hair_description: string | null
          id: string
          initials: string
          metadata: Json | null
          name: string
          personality: string | null
          project_id: string
          prompt_snippet: string | null
          reference_image_path: string | null
          reference_image_url: string | null
          role: string | null
          role_rules: Json | null
          rules: Json | null
          signature_clothing: string | null
          signature_tools: string[] | null
          sort_order: number | null
          updated_at: string | null
          visual_description: string | null
        }
        Insert: {
          accessories?: string[] | null
          ai_notes?: string | null
          appears_in_scenes?: string[] | null
          color_accent?: string | null
          created_at?: string | null
          description?: string | null
          hair_description?: string | null
          id?: string
          initials?: string
          metadata?: Json | null
          name: string
          personality?: string | null
          project_id: string
          prompt_snippet?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          role?: string | null
          role_rules?: Json | null
          rules?: Json | null
          signature_clothing?: string | null
          signature_tools?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
          visual_description?: string | null
        }
        Update: {
          accessories?: string[] | null
          ai_notes?: string | null
          appears_in_scenes?: string[] | null
          color_accent?: string | null
          created_at?: string | null
          description?: string | null
          hair_description?: string | null
          id?: string
          initials?: string
          metadata?: Json | null
          name?: string
          personality?: string | null
          project_id?: string
          prompt_snippet?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          role?: string | null
          role_rules?: Json | null
          rules?: Json | null
          signature_clothing?: string | null
          signature_tools?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
          visual_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          project_id: string
          resolved: boolean | null
          scene_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id: string
          resolved?: boolean | null
          scene_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id?: string
          resolved?: boolean | null
          scene_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          config: Json | null
          created_at: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          format: Database["public"]["Enums"]["export_format"]
          id: string
          notes: string | null
          project_id: string
          version: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format: Database["public"]["Enums"]["export_format"]
          id?: string
          notes?: string | null
          project_id: string
          version?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          notes?: string | null
          project_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          page_url: string | null
          screenshot_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          page_url?: string | null
          screenshot_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          page_url?: string | null
          screenshot_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narration_history: {
        Row: {
          audio_duration_ms: number | null
          audio_path: string | null
          audio_url: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          narration_text: string | null
          project_id: string
          scene_id: string | null
          speed: number | null
          style: string | null
          voice_id: string | null
          voice_name: string | null
        }
        Insert: {
          audio_duration_ms?: number | null
          audio_path?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          narration_text?: string | null
          project_id: string
          scene_id?: string | null
          speed?: number | null
          style?: string | null
          voice_id?: string | null
          voice_name?: string | null
        }
        Update: {
          audio_duration_ms?: number | null
          audio_path?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          narration_text?: string | null
          project_id?: string
          scene_id?: string | null
          speed?: number | null
          style?: string | null
          voice_id?: string | null
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narration_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narration_history_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_arcs: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_second: number | null
          icon: string | null
          id: string
          phase: string
          phase_number: number
          project_id: string
          scene_ids: string[] | null
          scene_numbers: string[] | null
          sort_order: number | null
          start_second: number | null
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_second?: number | null
          icon?: string | null
          id?: string
          phase: string
          phase_number: number
          project_id: string
          scene_ids?: string[] | null
          scene_numbers?: string[] | null
          sort_order?: number | null
          start_second?: number | null
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_second?: number | null
          icon?: string | null
          id?: string
          phase?: string
          phase_number?: number
          project_id?: string
          scene_ids?: string[] | null
          scene_numbers?: string[] | null
          sort_order?: number | null
          start_second?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_arcs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          project_id: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          project_id?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          project_id?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_active_at: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_active_at?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      project_favorites: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_issues: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          priority: number | null
          project_id: string
          resolution_notes: string | null
          resolved: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          priority?: number | null
          project_id: string
          resolution_notes?: string | null
          resolved?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          priority?: number | null
          project_id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_public_link: boolean | null
          project_id: string
          role: string
          shared_by: string
          shared_with_email: string | null
          shared_with_user: string | null
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public_link?: boolean | null
          project_id: string
          role?: string
          shared_by: string
          shared_with_email?: string | null
          shared_with_user?: string | null
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_public_link?: boolean | null
          project_id?: string
          role?: string
          shared_by?: string
          shared_with_email?: string | null
          shared_with_user?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_shared_with_user_fkey"
            columns: ["shared_with_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_analysis: Json | null
          ai_brief: string | null
          client_logo_url: string | null
          client_name: string | null
          color_palette: Json | null
          completion_percentage: number | null
          cover_image_url: string | null
          created_at: string | null
          custom_style_description: string | null
          description: string | null
          editor_state: Json | null
          estimated_duration_seconds: number | null
          global_rules: Json | null
          id: string
          image_generator: string | null
          image_generator_config: Json | null
          is_demo: boolean | null
          narration_config: Json | null
          narration_full_audio_url: string | null
          narration_full_text: string | null
          narration_mode: string | null
          organization_id: string | null
          owner_id: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          style: Database["public"]["Enums"]["project_style"]
          style_version: number | null
          tags: string[] | null
          target_duration_seconds: number | null
          target_platform: Database["public"]["Enums"]["target_platform"]
          thumbnail_url: string | null
          title: string
          total_backgrounds: number | null
          total_characters: number | null
          total_scenes: number | null
          updated_at: string | null
          video_generator: string | null
          video_generator_config: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_brief?: string | null
          client_logo_url?: string | null
          client_name?: string | null
          color_palette?: Json | null
          completion_percentage?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_style_description?: string | null
          description?: string | null
          editor_state?: Json | null
          estimated_duration_seconds?: number | null
          global_rules?: Json | null
          id?: string
          image_generator?: string | null
          image_generator_config?: Json | null
          is_demo?: boolean | null
          narration_config?: Json | null
          narration_full_audio_url?: string | null
          narration_full_text?: string | null
          narration_mode?: string | null
          organization_id?: string | null
          owner_id: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          style?: Database["public"]["Enums"]["project_style"]
          style_version?: number | null
          tags?: string[] | null
          target_duration_seconds?: number | null
          target_platform?: Database["public"]["Enums"]["target_platform"]
          thumbnail_url?: string | null
          title: string
          total_backgrounds?: number | null
          total_characters?: number | null
          total_scenes?: number | null
          updated_at?: string | null
          video_generator?: string | null
          video_generator_config?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_brief?: string | null
          client_logo_url?: string | null
          client_name?: string | null
          color_palette?: Json | null
          completion_percentage?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_style_description?: string | null
          description?: string | null
          editor_state?: Json | null
          estimated_duration_seconds?: number | null
          global_rules?: Json | null
          id?: string
          image_generator?: string | null
          image_generator_config?: Json | null
          is_demo?: boolean | null
          narration_config?: Json | null
          narration_full_audio_url?: string | null
          narration_full_text?: string | null
          narration_mode?: string | null
          organization_id?: string | null
          owner_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          style?: Database["public"]["Enums"]["project_style"]
          style_version?: number | null
          tags?: string[] | null
          target_duration_seconds?: number | null
          target_platform?: Database["public"]["Enums"]["target_platform"]
          thumbnail_url?: string | null
          title?: string
          total_backgrounds?: number | null
          total_characters?: number | null
          total_scenes?: number | null
          updated_at?: string | null
          video_generator?: string | null
          video_generator_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_maps: {
        Row: {
          background_id: string | null
          character_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          priority: number | null
          project_id: string
          reference_type: string
          scene_id: string
        }
        Insert: {
          background_id?: string | null
          character_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          project_id: string
          reference_type: string
          scene_id: string
        }
        Update: {
          background_id?: string | null
          character_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          project_id?: string
          reference_type?: string
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_maps_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_maps_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_maps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_maps_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          arc_phase: Database["public"]["Enums"]["arc_phase"] | null
          background_id: string | null
          camera_angle: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement: Database["public"]["Enums"]["camera_movement"] | null
          camera_notes: string | null
          category: string | null
          character_ids: string[] | null
          created_at: string | null
          description: string | null
          director_notes: string | null
          duration_seconds: number | null
          end_time: string | null
          generated_image_path: string | null
          generated_image_thumbnail_url: string | null
          generated_image_url: string | null
          generated_video_path: string | null
          generated_video_url: string | null
          id: string
          image_versions: Json | null
          improvements: Json | null
          lighting: string | null
          metadata: Json | null
          mood: string | null
          music_intensity: number | null
          music_notes: string | null
          music_suggestion: string | null
          narration_audio_duration_ms: number | null
          narration_audio_path: string | null
          narration_audio_url: string | null
          narration_metadata: Json | null
          narration_speed: number | null
          narration_status: string | null
          narration_style: string | null
          narration_text: string | null
          narration_voice_id: string | null
          narration_voice_name: string | null
          notes: string | null
          project_id: string
          prompt_additions: string | null
          prompt_history: Json | null
          prompt_image: string | null
          prompt_video: string | null
          reference_tip: string | null
          required_references: string[] | null
          scene_number: string
          scene_type: Database["public"]["Enums"]["scene_type"]
          sfx_suggestion: string | null
          sort_order: number | null
          sound_notes: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["scene_status"]
          style_version: number | null
          title: string
          updated_at: string | null
          video_cut_id: string | null
        }
        Insert: {
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          background_id?: string | null
          camera_angle?: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement?:
            | Database["public"]["Enums"]["camera_movement"]
            | null
          camera_notes?: string | null
          category?: string | null
          character_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          director_notes?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          generated_image_path?: string | null
          generated_image_thumbnail_url?: string | null
          generated_image_url?: string | null
          generated_video_path?: string | null
          generated_video_url?: string | null
          id?: string
          image_versions?: Json | null
          improvements?: Json | null
          lighting?: string | null
          metadata?: Json | null
          mood?: string | null
          music_intensity?: number | null
          music_notes?: string | null
          music_suggestion?: string | null
          narration_audio_duration_ms?: number | null
          narration_audio_path?: string | null
          narration_audio_url?: string | null
          narration_metadata?: Json | null
          narration_speed?: number | null
          narration_status?: string | null
          narration_style?: string | null
          narration_text?: string | null
          narration_voice_id?: string | null
          narration_voice_name?: string | null
          notes?: string | null
          project_id: string
          prompt_additions?: string | null
          prompt_history?: Json | null
          prompt_image?: string | null
          prompt_video?: string | null
          reference_tip?: string | null
          required_references?: string[] | null
          scene_number: string
          scene_type?: Database["public"]["Enums"]["scene_type"]
          sfx_suggestion?: string | null
          sort_order?: number | null
          sound_notes?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["scene_status"]
          style_version?: number | null
          title: string
          updated_at?: string | null
          video_cut_id?: string | null
        }
        Update: {
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          background_id?: string | null
          camera_angle?: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement?:
            | Database["public"]["Enums"]["camera_movement"]
            | null
          camera_notes?: string | null
          category?: string | null
          character_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          director_notes?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          generated_image_path?: string | null
          generated_image_thumbnail_url?: string | null
          generated_image_url?: string | null
          generated_video_path?: string | null
          generated_video_url?: string | null
          id?: string
          image_versions?: Json | null
          improvements?: Json | null
          lighting?: string | null
          metadata?: Json | null
          mood?: string | null
          music_intensity?: number | null
          music_notes?: string | null
          music_suggestion?: string | null
          narration_audio_duration_ms?: number | null
          narration_audio_path?: string | null
          narration_audio_url?: string | null
          narration_metadata?: Json | null
          narration_speed?: number | null
          narration_status?: string | null
          narration_style?: string | null
          narration_text?: string | null
          narration_voice_id?: string | null
          narration_voice_name?: string | null
          notes?: string | null
          project_id?: string
          prompt_additions?: string | null
          prompt_history?: Json | null
          prompt_image?: string | null
          prompt_video?: string | null
          reference_tip?: string | null
          required_references?: string[] | null
          scene_number?: string
          scene_type?: Database["public"]["Enums"]["scene_type"]
          sfx_suggestion?: string | null
          sort_order?: number | null
          sound_notes?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["scene_status"]
          style_version?: number | null
          title?: string
          updated_at?: string | null
          video_cut_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_video_cut_id_fkey"
            columns: ["video_cut_id"]
            isOneToOne: false
            referencedRelation: "video_cuts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_generated_batch: string | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          depends_on: string[] | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          scene_id: string | null
          scheduled_date: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
          video_id: string | null
        }
        Insert: {
          ai_generated_batch?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          scene_id?: string | null
          scheduled_date?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
          video_id?: string | null
        }
        Update: {
          ai_generated_batch?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          scene_id?: string | null
          scheduled_date?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entries: {
        Row: {
          arc_phase: Database["public"]["Enums"]["arc_phase"] | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          end_time: string
          id: string
          metadata: Json | null
          phase_color: string | null
          project_id: string
          scene_id: string | null
          sort_order: number | null
          start_time: string
          timeline_version: string | null
          title: string
        }
        Insert: {
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time: string
          id?: string
          metadata?: Json | null
          phase_color?: string | null
          project_id: string
          scene_id?: string | null
          sort_order?: number | null
          start_time: string
          timeline_version?: string | null
          title: string
        }
        Update: {
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time?: string
          id?: string
          metadata?: Json | null
          phase_color?: string | null
          project_id?: string
          scene_id?: string | null
          sort_order?: number | null
          start_time?: string
          timeline_version?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entries_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          ai_images_generated: number | null
          ai_text_messages: number | null
          ai_videos_generated: number | null
          id: string
          period_start: string
          projects_count: number | null
          storage_bytes: number | null
          tts_characters: number | null
          user_id: string
        }
        Insert: {
          ai_images_generated?: number | null
          ai_text_messages?: number | null
          ai_videos_generated?: number | null
          id?: string
          period_start: string
          projects_count?: number | null
          storage_bytes?: number | null
          tts_characters?: number | null
          user_id: string
        }
        Update: {
          ai_images_generated?: number | null
          ai_text_messages?: number | null
          ai_videos_generated?: number | null
          id?: string
          period_start?: string
          projects_count?: number | null
          storage_bytes?: number | null
          tts_characters?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_hint: string
          budget_reset_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_used_at: string | null
          monthly_budget_usd: number | null
          monthly_spent_usd: number | null
          provider: string
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_key_hint: string
          budget_reset_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          monthly_budget_usd?: number | null
          monthly_spent_usd?: number | null
          provider: string
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_key_hint?: string
          budget_reset_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          monthly_budget_usd?: number | null
          monthly_spent_usd?: number | null
          provider?: string
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_cut_scenes: {
        Row: {
          created_at: string | null
          duration_override: number | null
          id: string
          narration_override: string | null
          notes: string | null
          scene_id: string
          sort_order: number
          transition_duration_ms: number | null
          transition_in: string | null
          transition_out: string | null
          video_cut_id: string
        }
        Insert: {
          created_at?: string | null
          duration_override?: number | null
          id?: string
          narration_override?: string | null
          notes?: string | null
          scene_id: string
          sort_order?: number
          transition_duration_ms?: number | null
          transition_in?: string | null
          transition_out?: string | null
          video_cut_id: string
        }
        Update: {
          created_at?: string | null
          duration_override?: number | null
          id?: string
          narration_override?: string | null
          notes?: string | null
          scene_id?: string
          sort_order?: number
          transition_duration_ms?: number | null
          transition_in?: string | null
          transition_out?: string | null
          video_cut_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_cut_scenes_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_cut_scenes_video_cut_id_fkey"
            columns: ["video_cut_id"]
            isOneToOne: false
            referencedRelation: "video_cuts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_cuts: {
        Row: {
          actual_duration_seconds: number | null
          aspect_ratio: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          platform: string
          project_id: string
          slug: string
          sort_order: number | null
          status: string
          target_duration_seconds: number
          updated_at: string | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          aspect_ratio?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          platform?: string
          project_id: string
          slug: string
          sort_order?: number | null
          status?: string
          target_duration_seconds?: number
          updated_at?: string | null
        }
        Update: {
          actual_duration_seconds?: number | null
          aspect_ratio?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          platform?: string
          project_id?: string
          slug?: string
          sort_order?: number | null
          status?: string
          target_duration_seconds?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_cuts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_usage_monthly: {
        Row: {
          error_count: number | null
          fallback_count: number | null
          month: string | null
          provider: string | null
          total_cost: number | null
          total_requests: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_approved: { Args: never; Returns: boolean }
      recalc_project_stats: { Args: { p_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      arc_phase: "hook" | "build" | "peak" | "close"
      camera_angle:
        | "wide"
        | "medium"
        | "close_up"
        | "extreme_close_up"
        | "pov"
        | "low_angle"
        | "high_angle"
        | "birds_eye"
        | "dutch"
        | "over_shoulder"
      camera_movement:
        | "static"
        | "dolly_in"
        | "dolly_out"
        | "pan_left"
        | "pan_right"
        | "tilt_up"
        | "tilt_down"
        | "tracking"
        | "crane"
        | "handheld"
        | "orbit"
      export_format: "html" | "json" | "markdown" | "pdf"
      issue_type: "strength" | "warning" | "suggestion"
      org_role: "owner" | "admin" | "member"
      org_type: "personal" | "team"
      project_status:
        | "draft"
        | "in_progress"
        | "review"
        | "completed"
        | "archived"
      project_style:
        | "pixar"
        | "realistic"
        | "anime"
        | "watercolor"
        | "flat_2d"
        | "cyberpunk"
        | "custom"
      scene_status:
        | "draft"
        | "prompt_ready"
        | "generating"
        | "generated"
        | "approved"
        | "rejected"
      scene_type: "original" | "improved" | "new" | "filler" | "video"
      target_platform:
        | "youtube"
        | "instagram_reels"
        | "tiktok"
        | "tv_commercial"
        | "web"
        | "custom"
      task_category:
        | "script"
        | "prompt"
        | "image_gen"
        | "video_gen"
        | "review"
        | "export"
        | "meeting"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "in_review"
        | "completed"
        | "blocked"
      user_role: "admin" | "editor" | "viewer" | "pending" | "blocked"
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
    Enums: {
      arc_phase: ["hook", "build", "peak", "close"],
      camera_angle: [
        "wide",
        "medium",
        "close_up",
        "extreme_close_up",
        "pov",
        "low_angle",
        "high_angle",
        "birds_eye",
        "dutch",
        "over_shoulder",
      ],
      camera_movement: [
        "static",
        "dolly_in",
        "dolly_out",
        "pan_left",
        "pan_right",
        "tilt_up",
        "tilt_down",
        "tracking",
        "crane",
        "handheld",
        "orbit",
      ],
      export_format: ["html", "json", "markdown", "pdf"],
      issue_type: ["strength", "warning", "suggestion"],
      org_role: ["owner", "admin", "member"],
      org_type: ["personal", "team"],
      project_status: [
        "draft",
        "in_progress",
        "review",
        "completed",
        "archived",
      ],
      project_style: [
        "pixar",
        "realistic",
        "anime",
        "watercolor",
        "flat_2d",
        "cyberpunk",
        "custom",
      ],
      scene_status: [
        "draft",
        "prompt_ready",
        "generating",
        "generated",
        "approved",
        "rejected",
      ],
      scene_type: ["original", "improved", "new", "filler", "video"],
      target_platform: [
        "youtube",
        "instagram_reels",
        "tiktok",
        "tv_commercial",
        "web",
        "custom",
      ],
      task_category: [
        "script",
        "prompt",
        "image_gen",
        "video_gen",
        "review",
        "export",
        "meeting",
        "other",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "in_progress",
        "in_review",
        "completed",
        "blocked",
      ],
      user_role: ["admin", "editor", "viewer", "pending", "blocked"],
    },
  },
} as const
