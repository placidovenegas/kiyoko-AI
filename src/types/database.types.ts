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
          affected_scene_ids: string[] | null
          completed: boolean | null
          context_entity_id: string | null
          context_entity_type: string | null
          context_url: string | null
          conversation_type: string | null
          created_at: string | null
          id: string
          message_count: number | null
          messages: Json
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          affected_scene_ids?: string[] | null
          completed?: boolean | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          context_url?: string | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          messages?: Json
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          affected_scene_ids?: string[] | null
          completed?: boolean | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          context_url?: string | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          messages?: Json
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string | null
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
          {
            foreignKeyName: "ai_conversations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
          ai_prompt_description: string | null
          ai_visual_analysis: Json | null
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
        }
        Insert: {
          ai_prompt_description?: string | null
          ai_visual_analysis?: Json | null
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
        }
        Update: {
          ai_prompt_description?: string | null
          ai_visual_analysis?: Json | null
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
      character_images: {
        Row: {
          angle_description: string | null
          character_id: string
          created_at: string | null
          file_path: string | null
          file_url: string | null
          generator: string | null
          id: string
          image_type: string
          is_primary: boolean | null
          prompt_used: string | null
          sort_order: number | null
          source: string | null
          thumbnail_url: string | null
        }
        Insert: {
          angle_description?: string | null
          character_id: string
          created_at?: string | null
          file_path?: string | null
          file_url?: string | null
          generator?: string | null
          id?: string
          image_type: string
          is_primary?: boolean | null
          prompt_used?: string | null
          sort_order?: number | null
          source?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          angle_description?: string | null
          character_id?: string
          created_at?: string | null
          file_path?: string | null
          file_url?: string | null
          generator?: string | null
          id?: string
          image_type?: string
          is_primary?: boolean | null
          prompt_used?: string | null
          sort_order?: number | null
          source?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          accessories: string[] | null
          ai_prompt_description: string | null
          ai_visual_analysis: Json | null
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
          rules: Json | null
          signature_clothing: string | null
          signature_tools: string[] | null
          sort_order: number | null
          updated_at: string | null
          visual_description: string | null
        }
        Insert: {
          accessories?: string[] | null
          ai_prompt_description?: string | null
          ai_visual_analysis?: Json | null
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
          rules?: Json | null
          signature_clothing?: string | null
          signature_tools?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
          visual_description?: string | null
        }
        Update: {
          accessories?: string[] | null
          ai_prompt_description?: string | null
          ai_visual_analysis?: Json | null
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
      entity_snapshots: {
        Row: {
          action_type: string
          conversation_id: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          project_id: string
          restored: boolean | null
          restored_at: string | null
          restored_by: string | null
          snapshot_data: Json
          user_id: string
        }
        Insert: {
          action_type: string
          conversation_id?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          project_id: string
          restored?: boolean | null
          restored_at?: string | null
          restored_by?: string | null
          snapshot_data: Json
          user_id: string
        }
        Update: {
          action_type?: string
          conversation_id?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string
          restored?: boolean | null
          restored_at?: string | null
          restored_by?: string | null
          snapshot_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_snapshots_restored_by_fkey"
            columns: ["restored_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          resolved_at: string | null
          screenshot_url: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          page_url?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          page_url?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string | null
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
          sort_order: number | null
          start_second: number | null
          title: string
          video_id: string
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
          sort_order?: number | null
          start_second?: number | null
          title: string
          video_id: string
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
          sort_order?: number | null
          start_second?: number | null
          title?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_arcs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_arcs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          creative_platforms: string | null
          creative_purpose: string | null
          creative_typical_duration: string | null
          creative_use_context: string | null
          creative_video_types: string | null
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
          creative_platforms?: string | null
          creative_purpose?: string | null
          creative_typical_duration?: string | null
          creative_use_context?: string | null
          creative_video_types?: string | null
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
          creative_platforms?: string | null
          creative_purpose?: string | null
          creative_typical_duration?: string | null
          creative_use_context?: string | null
          creative_video_types?: string | null
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
      project_ai_agents: {
        Row: {
          created_at: string | null
          creativity_level: number | null
          id: string
          is_default: boolean | null
          language: string | null
          name: string
          project_id: string
          system_prompt: string
          tone: string | null
          updated_at: string | null
          video_style_context: string | null
        }
        Insert: {
          created_at?: string | null
          creativity_level?: number | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          name: string
          project_id: string
          system_prompt: string
          tone?: string | null
          updated_at?: string | null
          video_style_context?: string | null
        }
        Update: {
          created_at?: string | null
          creativity_level?: number | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          name?: string
          project_id?: string
          system_prompt?: string
          tone?: string | null
          updated_at?: string | null
          video_style_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_ai_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ai_settings: {
        Row: {
          created_at: string | null
          id: string
          image_provider: string | null
          image_provider_config: Json | null
          project_id: string
          tts_provider: string | null
          tts_provider_config: Json | null
          updated_at: string | null
          video_alt_duration_seconds: number | null
          video_base_duration_seconds: number | null
          video_extension_duration_seconds: number | null
          video_provider: string | null
          video_provider_config: Json | null
          video_provider_url: string | null
          video_supports_extension: boolean | null
          vision_model: string | null
          vision_provider: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_provider?: string | null
          image_provider_config?: Json | null
          project_id: string
          tts_provider?: string | null
          tts_provider_config?: Json | null
          updated_at?: string | null
          video_alt_duration_seconds?: number | null
          video_base_duration_seconds?: number | null
          video_extension_duration_seconds?: number | null
          video_provider?: string | null
          video_provider_config?: Json | null
          video_provider_url?: string | null
          video_supports_extension?: boolean | null
          vision_model?: string | null
          vision_provider?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_provider?: string | null
          image_provider_config?: Json | null
          project_id?: string
          tts_provider?: string | null
          tts_provider_config?: Json | null
          updated_at?: string | null
          video_alt_duration_seconds?: number | null
          video_base_duration_seconds?: number | null
          video_extension_duration_seconds?: number | null
          video_provider?: string | null
          video_provider_config?: Json | null
          video_provider_url?: string | null
          video_supports_extension?: boolean | null
          vision_model?: string | null
          vision_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_ai_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          ai_brief: string | null
          client_logo_url: string | null
          client_name: string | null
          color_palette: Json | null
          cover_image_url: string | null
          created_at: string | null
          custom_style_description: string | null
          description: string | null
          global_prompt_rules: string | null
          id: string
          is_demo: boolean | null
          metadata: Json | null
          owner_id: string
          short_id: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          style: Database["public"]["Enums"]["project_style"]
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_brief?: string | null
          client_logo_url?: string | null
          client_name?: string | null
          color_palette?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_style_description?: string | null
          description?: string | null
          global_prompt_rules?: string | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          owner_id: string
          short_id: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          style?: Database["public"]["Enums"]["project_style"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_brief?: string | null
          client_logo_url?: string | null
          client_name?: string | null
          color_palette?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_style_description?: string | null
          description?: string | null
          global_prompt_rules?: string | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          owner_id?: string
          short_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          style?: Database["public"]["Enums"]["project_style"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          project_id: string
          sort_order: number | null
          template_text: string
          template_type: Database["public"]["Enums"]["prompt_type"]
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          project_id: string
          sort_order?: number | null
          template_text: string
          template_type?: Database["public"]["Enums"]["prompt_type"]
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          project_id?: string
          sort_order?: number | null
          template_text?: string
          template_type?: Database["public"]["Enums"]["prompt_type"]
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_items: {
        Row: {
          created_at: string | null
          description_es: string | null
          file_path: string | null
          file_url: string | null
          generation_config: Json | null
          generator: string | null
          id: string
          is_current: boolean | null
          item_type: string
          metadata: Json | null
          prompt_text: string | null
          publication_id: string
          sort_order: number
          status: string | null
          thumbnail_url: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description_es?: string | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          item_type: string
          metadata?: Json | null
          prompt_text?: string | null
          publication_id: string
          sort_order?: number
          status?: string | null
          thumbnail_url?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description_es?: string | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          item_type?: string
          metadata?: Json | null
          prompt_text?: string | null
          publication_id?: string
          sort_order?: number
          status?: string | null
          thumbnail_url?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publication_items_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          hashtags: string[] | null
          id: string
          likes_count: number | null
          metadata: Json | null
          project_id: string
          prompt_style_notes: string | null
          publication_type: string
          published_at: string | null
          published_url: string | null
          scheduled_at: string | null
          shares_count: number | null
          short_id: string
          social_profile_id: string
          sort_order: number | null
          source_scene_id: string | null
          source_video_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          hashtags?: string[] | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          project_id: string
          prompt_style_notes?: string | null
          publication_type: string
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          shares_count?: number | null
          short_id: string
          social_profile_id: string
          sort_order?: number | null
          source_scene_id?: string | null
          source_video_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          hashtags?: string[] | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          project_id?: string
          prompt_style_notes?: string | null
          publication_type?: string
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          shares_count?: number | null
          short_id?: string
          social_profile_id?: string
          sort_order?: number | null
          source_scene_id?: string | null
          source_video_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_social_profile_id_fkey"
            columns: ["social_profile_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_source_scene_id_fkey"
            columns: ["source_scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_source_video_id_fkey"
            columns: ["source_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_updates: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          payload: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          payload?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          payload?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_annotations: {
        Row: {
          author_email: string | null
          author_name: string
          content: string
          created_at: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          scene_id: string
          scene_share_id: string
          status: string | null
          timestamp_seconds: number | null
        }
        Insert: {
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          scene_id: string
          scene_share_id: string
          status?: string | null
          timestamp_seconds?: number | null
        }
        Update: {
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          scene_id?: string
          scene_share_id?: string
          status?: string | null
          timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_annotations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_annotations_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_annotations_scene_share_id_fkey"
            columns: ["scene_share_id"]
            isOneToOne: false
            referencedRelation: "scene_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_backgrounds: {
        Row: {
          angle: string | null
          background_id: string
          id: string
          is_primary: boolean | null
          scene_id: string
          time_of_day: string | null
        }
        Insert: {
          angle?: string | null
          background_id: string
          id?: string
          is_primary?: boolean | null
          scene_id: string
          time_of_day?: string | null
        }
        Update: {
          angle?: string | null
          background_id?: string
          id?: string
          is_primary?: boolean | null
          scene_id?: string
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_backgrounds_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_backgrounds_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_camera: {
        Row: {
          ai_reasoning: string | null
          camera_angle: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement: Database["public"]["Enums"]["camera_movement"] | null
          camera_notes: string | null
          created_at: string | null
          id: string
          lighting: string | null
          mood: string | null
          scene_id: string
          updated_at: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          camera_angle?: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement?:
            | Database["public"]["Enums"]["camera_movement"]
            | null
          camera_notes?: string | null
          created_at?: string | null
          id?: string
          lighting?: string | null
          mood?: string | null
          scene_id: string
          updated_at?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          camera_angle?: Database["public"]["Enums"]["camera_angle"] | null
          camera_movement?:
            | Database["public"]["Enums"]["camera_movement"]
            | null
          camera_notes?: string | null
          created_at?: string | null
          id?: string
          lighting?: string | null
          mood?: string | null
          scene_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_camera_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: true
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_characters: {
        Row: {
          character_id: string
          id: string
          role_in_scene: string | null
          scene_id: string
          sort_order: number | null
        }
        Insert: {
          character_id: string
          id?: string
          role_in_scene?: string | null
          scene_id: string
          sort_order?: number | null
        }
        Update: {
          character_id?: string
          id?: string
          role_in_scene?: string | null
          scene_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_characters_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_media: {
        Row: {
          created_at: string | null
          file_path: string | null
          file_url: string | null
          generation_config: Json | null
          generator: string | null
          id: string
          is_current: boolean | null
          media_type: Database["public"]["Enums"]["media_type"]
          metadata: Json | null
          prompt_used: string | null
          scene_id: string
          status: string | null
          thumbnail_url: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          prompt_used?: string | null
          scene_id: string
          status?: string | null
          thumbnail_url?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          prompt_used?: string | null
          scene_id?: string
          status?: string | null
          thumbnail_url?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_media_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_prompts: {
        Row: {
          created_at: string | null
          generation_config: Json | null
          generator: string | null
          id: string
          is_current: boolean | null
          negative_prompt: string | null
          prompt_quality_score: number | null
          prompt_text: string
          prompt_type: Database["public"]["Enums"]["prompt_type"]
          result_url: string | null
          scene_id: string
          status: string | null
          target_tool: string | null
          version: number | null
          visual_style_notes: string | null
        }
        Insert: {
          created_at?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          negative_prompt?: string | null
          prompt_quality_score?: number | null
          prompt_text: string
          prompt_type?: Database["public"]["Enums"]["prompt_type"]
          result_url?: string | null
          scene_id: string
          status?: string | null
          target_tool?: string | null
          version?: number | null
          visual_style_notes?: string | null
        }
        Update: {
          created_at?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          negative_prompt?: string | null
          prompt_quality_score?: number | null
          prompt_text?: string
          prompt_type?: Database["public"]["Enums"]["prompt_type"]
          result_url?: string | null
          scene_id?: string
          status?: string | null
          target_tool?: string | null
          version?: number | null
          visual_style_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_prompts_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_shares: {
        Row: {
          allow_annotations: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_all_scenes: boolean | null
          password_hash: string | null
          project_id: string
          scene_ids: string[] | null
          shared_by: string
          token: string
          video_id: string
          view_count: number | null
        }
        Insert: {
          allow_annotations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_all_scenes?: boolean | null
          password_hash?: string | null
          project_id: string
          scene_ids?: string[] | null
          shared_by: string
          token: string
          video_id: string
          view_count?: number | null
        }
        Update: {
          allow_annotations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_all_scenes?: boolean | null
          password_hash?: string | null
          project_id?: string
          scene_ids?: string[] | null
          shared_by?: string
          token?: string
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_video_clips: {
        Row: {
          ai_extension_reasoning: string | null
          clip_type: string
          created_at: string | null
          duration_seconds: number | null
          extension_number: number | null
          file_path: string | null
          file_url: string | null
          generation_config: Json | null
          generator: string | null
          id: string
          is_current: boolean | null
          last_frame_path: string | null
          last_frame_url: string | null
          metadata: Json | null
          parent_clip_id: string | null
          prompt_image_first_frame: string | null
          prompt_video: string | null
          scene_id: string
          status: string | null
          thumbnail_url: string | null
          updated_at: string | null
          version: number | null
          visual_description_es: string | null
        }
        Insert: {
          ai_extension_reasoning?: string | null
          clip_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          extension_number?: number | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          last_frame_path?: string | null
          last_frame_url?: string | null
          metadata?: Json | null
          parent_clip_id?: string | null
          prompt_image_first_frame?: string | null
          prompt_video?: string | null
          scene_id: string
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          version?: number | null
          visual_description_es?: string | null
        }
        Update: {
          ai_extension_reasoning?: string | null
          clip_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          extension_number?: number | null
          file_path?: string | null
          file_url?: string | null
          generation_config?: Json | null
          generator?: string | null
          id?: string
          is_current?: boolean | null
          last_frame_path?: string | null
          last_frame_url?: string | null
          metadata?: Json | null
          parent_clip_id?: string | null
          prompt_image_first_frame?: string | null
          prompt_video?: string | null
          scene_id?: string
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          version?: number | null
          visual_description_es?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_video_clips_parent_clip_id_fkey"
            columns: ["parent_clip_id"]
            isOneToOne: false
            referencedRelation: "scene_video_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_video_clips_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          annotation_source: string | null
          arc_phase: Database["public"]["Enums"]["arc_phase"] | null
          audio_config: Json | null
          client_annotation: string | null
          continuation_of_scene_id: string | null
          created_at: string | null
          description: string | null
          dialogue: string | null
          director_notes: string | null
          duration_seconds: number | null
          generation_context: string | null
          id: string
          is_filler: boolean | null
          metadata: Json | null
          notes: string | null
          parent_scene_id: string | null
          project_id: string
          scene_number: number
          scene_type: Database["public"]["Enums"]["scene_type"]
          short_id: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["scene_status"]
          sub_order: number | null
          time_of_day: string | null
          title: string
          updated_at: string | null
          video_id: string
        }
        Insert: {
          annotation_source?: string | null
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          audio_config?: Json | null
          client_annotation?: string | null
          continuation_of_scene_id?: string | null
          created_at?: string | null
          description?: string | null
          dialogue?: string | null
          director_notes?: string | null
          duration_seconds?: number | null
          generation_context?: string | null
          id?: string
          is_filler?: boolean | null
          metadata?: Json | null
          notes?: string | null
          parent_scene_id?: string | null
          project_id: string
          scene_number?: number
          scene_type?: Database["public"]["Enums"]["scene_type"]
          short_id?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["scene_status"]
          sub_order?: number | null
          time_of_day?: string | null
          title: string
          updated_at?: string | null
          video_id: string
        }
        Update: {
          annotation_source?: string | null
          arc_phase?: Database["public"]["Enums"]["arc_phase"] | null
          audio_config?: Json | null
          client_annotation?: string | null
          continuation_of_scene_id?: string | null
          created_at?: string | null
          description?: string | null
          dialogue?: string | null
          director_notes?: string | null
          duration_seconds?: number | null
          generation_context?: string | null
          id?: string
          is_filler?: boolean | null
          metadata?: Json | null
          notes?: string | null
          parent_scene_id?: string | null
          project_id?: string
          scene_number?: number
          scene_type?: Database["public"]["Enums"]["scene_type"]
          short_id?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["scene_status"]
          sub_order?: number | null
          time_of_day?: string | null
          title?: string
          updated_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_continuation_of_scene_id_fkey"
            columns: ["continuation_of_scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_parent_scene_id_fkey"
            columns: ["parent_scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
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
            foreignKeyName: "scenes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          account_handle: string | null
          account_name: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          id: string
          platform: string
          profile_url: string | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          account_handle?: string | null
          account_name: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          id?: string
          platform: string
          profile_url?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          account_handle?: string | null
          account_name?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          id?: string
          platform?: string
          profile_url?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      style_presets: {
        Row: {
          color_palette: Json | null
          created_at: string | null
          description: string | null
          generator: string | null
          generator_config: Json | null
          id: string
          is_default: boolean | null
          name: string
          negative_prompt: string | null
          project_id: string
          prompt_prefix: string | null
          prompt_suffix: string | null
          reference_image_url: string | null
          sort_order: number | null
          style_type: string | null
          updated_at: string | null
        }
        Insert: {
          color_palette?: Json | null
          created_at?: string | null
          description?: string | null
          generator?: string | null
          generator_config?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          negative_prompt?: string | null
          project_id: string
          prompt_prefix?: string | null
          prompt_suffix?: string | null
          reference_image_url?: string | null
          sort_order?: number | null
          style_type?: string | null
          updated_at?: string | null
        }
        Update: {
          color_palette?: Json | null
          created_at?: string | null
          description?: string | null
          generator?: string | null
          generator_config?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          negative_prompt?: string | null
          project_id?: string
          prompt_prefix?: string | null
          prompt_suffix?: string | null
          reference_image_url?: string | null
          sort_order?: number | null
          style_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_presets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          {
            foreignKeyName: "tasks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
          video_id: string
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
          video_id: string
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
          video_id?: string
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
          {
            foreignKeyName: "timeline_entries_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      video_analysis: {
        Row: {
          analysis_model: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          overall_score: number | null
          status: string | null
          strengths: Json | null
          suggestions: Json | null
          summary: string | null
          updated_at: string | null
          version: number | null
          video_id: string
          weaknesses: Json | null
        }
        Insert: {
          analysis_model?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          overall_score?: number | null
          status?: string | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          updated_at?: string | null
          version?: number | null
          video_id: string
          weaknesses?: Json | null
        }
        Update: {
          analysis_model?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          overall_score?: number | null
          status?: string | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          updated_at?: string | null
          version?: number | null
          video_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_derivations: {
        Row: {
          created_at: string | null
          derivation_notes: string | null
          derivation_type: string | null
          derived_video_id: string
          id: string
          source_video_id: string
        }
        Insert: {
          created_at?: string | null
          derivation_notes?: string | null
          derivation_type?: string | null
          derived_video_id: string
          id?: string
          source_video_id: string
        }
        Update: {
          created_at?: string | null
          derivation_notes?: string | null
          derivation_type?: string | null
          derived_video_id?: string
          id?: string
          source_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_derivations_derived_video_id_fkey"
            columns: ["derived_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_derivations_source_video_id_fkey"
            columns: ["source_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_narrations: {
        Row: {
          audio_duration_ms: number | null
          audio_path: string | null
          audio_url: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          narration_text: string
          provider: string | null
          source: string | null
          speed: number | null
          status: string | null
          style: string | null
          updated_at: string | null
          version: number | null
          video_id: string
          voice_id: string | null
          voice_name: string | null
        }
        Insert: {
          audio_duration_ms?: number | null
          audio_path?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          narration_text?: string
          provider?: string | null
          source?: string | null
          speed?: number | null
          status?: string | null
          style?: string | null
          updated_at?: string | null
          version?: number | null
          video_id: string
          voice_id?: string | null
          voice_name?: string | null
        }
        Update: {
          audio_duration_ms?: number | null
          audio_path?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          narration_text?: string
          provider?: string | null
          source?: string | null
          speed?: number | null
          status?: string | null
          style?: string | null
          updated_at?: string | null
          version?: number | null
          video_id?: string
          voice_id?: string | null
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_narrations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          aspect_ratio: string | null
          created_at: string | null
          description: string | null
          id: string
          is_primary: boolean | null
          metadata: Json | null
          narration_provider: string | null
          narration_speed: number | null
          narration_style: string | null
          narration_voice_id: string | null
          narration_voice_name: string | null
          platform: Database["public"]["Enums"]["target_platform"]
          project_id: string
          short_id: string
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["video_status"]
          style_preset_id: string | null
          target_duration_seconds: number | null
          title: string
          updated_at: string | null
          video_type: Database["public"]["Enums"]["video_type"]
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          narration_provider?: string | null
          narration_speed?: number | null
          narration_style?: string | null
          narration_voice_id?: string | null
          narration_voice_name?: string | null
          platform?: Database["public"]["Enums"]["target_platform"]
          project_id: string
          short_id: string
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          style_preset_id?: string | null
          target_duration_seconds?: number | null
          title: string
          updated_at?: string | null
          video_type?: Database["public"]["Enums"]["video_type"]
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          narration_provider?: string | null
          narration_speed?: number | null
          narration_style?: string | null
          narration_voice_id?: string | null
          narration_voice_name?: string | null
          platform?: Database["public"]["Enums"]["target_platform"]
          project_id?: string
          short_id?: string
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          style_preset_id?: string | null
          target_duration_seconds?: number | null
          title?: string
          updated_at?: string | null
          video_type?: Database["public"]["Enums"]["video_type"]
        }
        Relationships: [
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_style_preset_id_fkey"
            columns: ["style_preset_id"]
            isOneToOne: false
            referencedRelation: "style_presets"
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_project_access: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      user_is_admin: { Args: never; Returns: boolean }
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
      export_format: "html" | "json" | "markdown" | "pdf" | "mp4" | "mov"
      media_type: "image" | "video" | "audio"
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
      prompt_type: "image" | "video" | "narration" | "analysis"
      scene_status:
        | "draft"
        | "prompt_ready"
        | "generating"
        | "generated"
        | "approved"
        | "rejected"
      scene_type:
        | "original"
        | "improved"
        | "new"
        | "filler"
        | "video"
        | "extension"
        | "insert"
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
        | "voiceover"
        | "editing"
        | "issue"
        | "annotation"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "in_review"
        | "completed"
        | "blocked"
      user_role: "admin" | "editor" | "viewer" | "pending" | "blocked"
      video_status:
        | "draft"
        | "prompting"
        | "generating"
        | "review"
        | "approved"
        | "exported"
      video_type: "long" | "short" | "reel" | "story" | "ad" | "custom"
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
      export_format: ["html", "json", "markdown", "pdf", "mp4", "mov"],
      media_type: ["image", "video", "audio"],
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
      prompt_type: ["image", "video", "narration", "analysis"],
      scene_status: [
        "draft",
        "prompt_ready",
        "generating",
        "generated",
        "approved",
        "rejected",
      ],
      scene_type: [
        "original",
        "improved",
        "new",
        "filler",
        "video",
        "extension",
        "insert",
      ],
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
        "voiceover",
        "editing",
        "issue",
        "annotation",
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
      video_status: [
        "draft",
        "prompting",
        "generating",
        "review",
        "approved",
        "exported",
      ],
      video_type: ["long", "short", "reel", "story", "ad", "custom"],
    },
  },
} as const
