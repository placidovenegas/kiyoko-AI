-- =============================================
-- Kiyoko AI — Seed: Proyecto Demo Domenech
-- Migration: 00004_seed_domenech.sql
-- =============================================
-- This migration inserts the complete Domenech Peluquerías demo project.
-- It uses a fixed UUID for the demo owner and bypasses RLS via service_role.
-- All IDs are stored in variables so foreign keys are consistent.
-- =============================================

BEGIN;

-- =============================================
-- 0. FIXED UUIDs
-- =============================================
-- We use deterministic UUIDs so this seed is idempotent and
-- foreign key references are predictable.

DO $$
DECLARE
  -- Demo owner
  v_owner_id     UUID := '00000000-0000-4000-a000-000000000001';

  -- Project
  v_project_id   UUID := '00000000-0000-4000-a000-000000000010';

  -- Characters
  v_char_jose    UUID := '00000000-0000-4000-a000-000000000101';
  v_char_conchi  UUID := '00000000-0000-4000-a000-000000000102';
  v_char_nerea   UUID := '00000000-0000-4000-a000-000000000103';
  v_char_raul    UUID := '00000000-0000-4000-a000-000000000104';

  -- Backgrounds
  v_bg_ext       UUID := '00000000-0000-4000-a000-000000000201';
  v_bg_pelucas   UUID := '00000000-0000-4000-a000-000000000202';
  v_bg_estilismo UUID := '00000000-0000-4000-a000-000000000203';

  -- Scenes (28 total)
  v_scene_e1     UUID := '00000000-0000-4000-a000-000000000301';
  v_scene_e2     UUID := '00000000-0000-4000-a000-000000000302';
  v_scene_e3     UUID := '00000000-0000-4000-a000-000000000303';
  v_scene_e4a    UUID := '00000000-0000-4000-a000-000000000304';
  v_scene_e4b    UUID := '00000000-0000-4000-a000-000000000305';
  v_scene_e5     UUID := '00000000-0000-4000-a000-000000000306';
  v_scene_e6     UUID := '00000000-0000-4000-a000-000000000307';
  v_scene_e7     UUID := '00000000-0000-4000-a000-000000000308';
  v_scene_e7b    UUID := '00000000-0000-4000-a000-000000000309';
  v_scene_e7c    UUID := '00000000-0000-4000-a000-000000000310';
  v_scene_e7d    UUID := '00000000-0000-4000-a000-000000000311';
  v_scene_e8     UUID := '00000000-0000-4000-a000-000000000312';
  v_scene_e9     UUID := '00000000-0000-4000-a000-000000000313';
  v_scene_n1     UUID := '00000000-0000-4000-a000-000000000314';
  v_scene_n2     UUID := '00000000-0000-4000-a000-000000000315';
  v_scene_n3     UUID := '00000000-0000-4000-a000-000000000316';
  v_scene_n4     UUID := '00000000-0000-4000-a000-000000000317';
  v_scene_n5     UUID := '00000000-0000-4000-a000-000000000318';
  v_scene_n6     UUID := '00000000-0000-4000-a000-000000000319';
  v_scene_n7     UUID := '00000000-0000-4000-a000-000000000320';
  v_scene_n8     UUID := '00000000-0000-4000-a000-000000000321';
  v_scene_n9     UUID := '00000000-0000-4000-a000-000000000322';
  v_scene_r1     UUID := '00000000-0000-4000-a000-000000000323';
  v_scene_r2     UUID := '00000000-0000-4000-a000-000000000324';
  v_scene_r3     UUID := '00000000-0000-4000-a000-000000000325';
  v_scene_r4     UUID := '00000000-0000-4000-a000-000000000326';
  v_scene_v6     UUID := '00000000-0000-4000-a000-000000000327';
  v_scene_v7     UUID := '00000000-0000-4000-a000-000000000328';

  -- Narrative arcs
  v_arc_1        UUID := '00000000-0000-4000-a000-000000000401';
  v_arc_2        UUID := '00000000-0000-4000-a000-000000000402';
  v_arc_3        UUID := '00000000-0000-4000-a000-000000000403';
  v_arc_4        UUID := '00000000-0000-4000-a000-000000000404';
  v_arc_5        UUID := '00000000-0000-4000-a000-000000000405';
  v_arc_6        UUID := '00000000-0000-4000-a000-000000000406';

BEGIN

  -- =============================================
  -- 1. DEMO OWNER PROFILE
  -- =============================================
  -- Insert directly into auth.users with a fixed UUID.
  -- The trigger will NOT fire for this since we also insert the profile manually.
  -- We use INSERT ... ON CONFLICT to make this idempotent.

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_owner_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@kiyoko.ai',
    crypt('demo-password-not-for-login', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Demo User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert profile (bypasses the trigger since we do it manually)
  INSERT INTO public.profiles (
    id, email, full_name, role, bio, company
  ) VALUES (
    v_owner_id,
    'demo@kiyoko.ai',
    'Demo User',
    'viewer',
    'Cuenta demo de Kiyoko AI para el proyecto Domenech Peluquerías.',
    'Kiyoko AI'
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 2. PROJECT
  -- =============================================
  INSERT INTO public.projects (
    id, owner_id, title, slug, description, client_name,
    style, status, target_duration_seconds, target_platform,
    color_palette, ai_brief, image_generator, tags, is_demo,
    total_scenes, total_characters, total_backgrounds,
    estimated_duration_seconds, completion_percentage
  ) VALUES (
    v_project_id,
    v_owner_id,
    'Domenech Peluquerías',
    'domenech-peluquerias',
    'Storyboard estilo Pixar 3D para vídeo promocional de Domenech Peluquerías. Presenta al equipo de 4 profesionales, sus servicios de estilismo y barbería, y su especialidad en prótesis capilares. Duración objetivo: 75 segundos para YouTube.',
    'Domenech Peluquerías',
    'pixar',
    'in_progress',
    75,
    'youtube',
    '{
      "primary": "#C8860A",
      "secondary": "#E8943A",
      "accent": "#F5EDD8",
      "dark": "#2A1A0A",
      "light": "#FFF8EB"
    }',
    'Somos una peluquería familiar llamada Domenech. Tenemos 4 profesionales: José (el jefe), Conchi (estilista senior), Nerea (especialista en prótesis capilares) y Raúl (barbero). Queremos un vídeo promocional estilo Pixar 3D de unos 75 segundos para YouTube que muestre nuestros servicios, especialmente las prótesis capilares que es nuestra especialidad diferenciadora.',
    'grok_aurora',
    ARRAY['peluquería', 'pixar', 'prótesis capilar', 'barbería', 'estilismo', 'demo'],
    TRUE,
    28, -- total_scenes
    4,  -- total_characters
    3,  -- total_backgrounds
    75.0,
    0
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 3. CHARACTERS (4)
  -- =============================================

  -- José - Director/Jefe
  INSERT INTO public.characters (
    id, project_id, name, initials, role, description,
    visual_description, prompt_snippet, personality,
    signature_clothing, hair_description, accessories,
    signature_tools, color_accent, appears_in_scenes, sort_order
  ) VALUES (
    v_char_jose, v_project_id,
    'José', 'JO',
    'Director · El jefe',
    'Dueño y director de Domenech Peluquerías. Presencia imponente y carismática. Lidera el equipo con confianza y calidez.',
    'Hombre corpulento y confiado, pelo castaño rojizo peinado hacia atrás con pecas, blazer azul acero sobre camisa negra, collar de plata, sonrisa cálida.',
    'a heavyset confident man, auburn-brown swept-back hair, freckles, wearing a blue steel blazer over a black shirt, silver necklace, warm smile',
    'Confiado, cálido, líder natural, carismático',
    'Blazer azul acero sobre camisa negra',
    'Pelo castaño rojizo peinado hacia atrás',
    ARRAY['collar de plata', 'pulseras'],
    ARRAY['tijeras profesionales'],
    '#3B82F6',
    ARRAY['E3','E5','E6','E8','E9','N5','N8'],
    1
  ) ON CONFLICT (id) DO NOTHING;

  -- Conchi - Estilista senior
  INSERT INTO public.characters (
    id, project_id, name, initials, role, description,
    visual_description, prompt_snippet, personality,
    signature_clothing, hair_description, accessories,
    signature_tools, color_accent, appears_in_scenes, sort_order
  ) VALUES (
    v_char_conchi, v_project_id,
    'Conchi', 'CO',
    'Estilista senior',
    'Estilista senior con años de experiencia. Transmite calidez y confianza a los clientes. Especialista en coloración y corte femenino.',
    'Mujer cálida de mediana edad, pelo rubio rizado por encima del hombro, jersey rosa sobre camisa blanca, sonrisa amable, herramientas de estilismo en mano.',
    'a warm middle-aged woman, curly shoulder-length blonde hair, wearing a pink sweater over a white shirt, gentle smile, holding hair styling tools',
    'Cálida, cercana, profesional, maternal',
    'Jersey rosa sobre camisa blanca',
    'Pelo rubio rizado por encima del hombro',
    ARRAY['pendientes discretos'],
    ARRAY['secador rose gold', 'cepillo redondo', 'tijeras'],
    '#EC4899',
    ARRAY['E3','E5','E6','E7B','E9','N4'],
    2
  ) ON CONFLICT (id) DO NOTHING;

  -- Nerea - Especialista prótesis
  INSERT INTO public.characters (
    id, project_id, name, initials, role, description,
    visual_description, prompt_snippet, personality,
    signature_clothing, hair_description, accessories,
    signature_tools, color_accent, appears_in_scenes, sort_order
  ) VALUES (
    v_char_nerea, v_project_id,
    'Nerea', 'NE',
    'Especialista en prótesis capilares',
    'Joven especialista en prótesis capilares. Meticulosa y empática. Su trabajo transforma vidas devolviendo la confianza a los clientes.',
    'Mujer joven concentrada, pelo oscuro recogido en moño bajo, chaquetón color crema, guantes de nitrilo en escenas de prótesis, movimientos precisos.',
    'a focused young woman, dark hair in a low bun, wearing a cream-colored jacket, latex gloves, precise movements, working with hair prosthetics',
    'Concentrada, empática, meticulosa, profesional',
    'Chaquetón color crema',
    'Pelo oscuro recogido en moño bajo',
    ARRAY['guantes de nitrilo'],
    ARRAY['adhesivo capilar', 'pinzas de precisión', 'peine de cola'],
    '#8B5CF6',
    ARRAY['E3','E4A','E4B','E5','E7C','E9','N7'],
    3
  ) ON CONFLICT (id) DO NOTHING;

  -- Raúl - Barbero
  INSERT INTO public.characters (
    id, project_id, name, initials, role, description,
    visual_description, prompt_snippet, personality,
    signature_clothing, hair_description, accessories,
    signature_tools, color_accent, appears_in_scenes, sort_order
  ) VALUES (
    v_char_raul, v_project_id,
    'Raúl', 'RA',
    'Barbero',
    'Barbero joven y moderno. Estilo urbano con tatuajes visibles. Especialista en degradados y barbería contemporánea.',
    'Hombre joven en forma, barba cuidada, tatuajes visibles en los brazos, camiseta negra ajustada, sostiene maquinilla de barbero con confianza.',
    'a fit young man with a well-groomed beard, visible tattoos on arms, wearing a fitted black t-shirt, confidently holding barber clippers',
    'Seguro, moderno, enérgico, creativo',
    'Camiseta negra ajustada',
    'Barba cuidada, pelo corto estilizado',
    ARRAY['tatuajes visibles en brazos'],
    ARRAY['maquinilla de barbero', 'navaja', 'peine de barbero'],
    '#10B981',
    ARRAY['E6','E7','E7D','N8','N9'],
    4
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 4. BACKGROUNDS (3)
  -- =============================================

  -- REF-EXT - Fachada exterior
  INSERT INTO public.backgrounds (
    id, project_id, code, name, description,
    location_type, time_of_day, prompt_snippet,
    available_angles, used_in_scenes, sort_order
  ) VALUES (
    v_bg_ext, v_project_id,
    'REF-EXT',
    'Fachada exterior del salón',
    'Fachada moderna de cristal del salón Domenech con letras doradas DOMENECH, luz cálida de atardecer, entorno urbano.',
    'exterior', 'day',
    'exterior facade of Domenech hair salon, modern glass storefront with golden DOMENECH lettering, warm afternoon light, urban street setting',
    ARRAY['frontal', 'lateral', 'angular', 'POV entrada'],
    ARRAY['E2', 'E9', 'N2'],
    1
  ) ON CONFLICT (id) DO NOTHING;

  -- REF-PELUCAS - Sala de prótesis
  INSERT INTO public.backgrounds (
    id, project_id, code, name, description,
    location_type, time_of_day, prompt_snippet,
    available_angles, used_in_scenes, sort_order
  ) VALUES (
    v_bg_pelucas, v_project_id,
    'REF-PELUCAS',
    'Sala de prótesis capilares',
    'Sala íntima de consulta de prótesis capilares con iluminación suave y cálida, cabezas de maniquí con pelucas, espejos, espacio privado.',
    'interior', 'day',
    'interior of a specialized hair prosthetics consultation room, soft warm lighting, mannequin heads with wigs, mirrors, intimate private space',
    ARRAY['frontal', 'lateral', 'detalle mesa', 'POV cliente'],
    ARRAY['E4A', 'E4B', 'N6', 'N7'],
    2
  ) ON CONFLICT (id) DO NOTHING;

  -- REF-ESTILISMO - Sala principal
  INSERT INTO public.backgrounds (
    id, project_id, code, name, description,
    location_type, time_of_day, prompt_snippet,
    available_angles, used_in_scenes, sort_order
  ) VALUES (
    v_bg_estilismo, v_project_id,
    'REF-ESTILISMO',
    'Sala principal de estilismo',
    'Zona principal del salón con múltiples estaciones de estilismo, espejos, iluminación ámbar cálida, diseño moderno, herramientas visibles.',
    'interior', 'day',
    'interior of the main styling area of Domenech salon, multiple styling stations with mirrors, warm amber lighting, modern design, hair tools visible',
    ARRAY['panorámica', 'estación individual', 'espejo', 'cenital'],
    ARRAY['E3', 'E5', 'E6', 'E7', 'E7B', 'E7C', 'E7D', 'E8', 'N4', 'N5', 'N8', 'N9'],
    3
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 5. SCENES (28 total)
  -- =============================================
  -- Scene types: original, improved, new, filler, video
  -- Arc phases: hook, build, peak, close

  -- ----- E1: Logo Reveal -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image, prompt_additions,
    improvements,
    duration_seconds, start_time, end_time,
    camera_angle, camera_movement,
    lighting, mood, music_notes,
    status, sort_order
  ) VALUES (
    v_scene_e1, v_project_id,
    'E1', 'Logo Reveal', 'improved', 'intro', 'hook',
    'Un mechón de pelo dorado flota en el aire, se riza y forma la palabra DOMENECH en caligrafía elegante. Fondo oscuro con luz volumétrica dorada y partículas de polvo de oro.',
    'Asegurar que las letras DOMENECH sean legibles y elegantes. El mechón debe tener movimiento fluido y natural.',
    'Pixar Studios 3D animated render, golden hair strand floating in air, curling and forming the word DOMENECH in elegant calligraphy, dark background, volumetric golden light, particles of gold dust, cinematic, 4K',
    'Add subtle camera push-in as the letters form. Include a brief sparkle effect when the word is complete.',
    '[{"type": "improve", "text": "Añadido movimiento de cámara push-in durante la formación de letras"}, {"type": "add", "text": "Efecto de destello al completar la palabra"}]',
    5.0, '0:03', '0:08',
    'medium', 'dolly_in',
    'Volumetric golden light, dark background',
    'Elegant, dramatic, premium',
    'Intro musical suave con arpa o piano, crescendo al revelar el nombre',
    'prompt_ready', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E2: Exterior Dolly-In -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image, prompt_additions,
    improvements,
    duration_seconds, start_time, end_time,
    background_id,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e2, v_project_id,
    'E2', 'Exterior Dolly-In', 'improved', 'presentation', 'build',
    'Cámara comienza a nivel del suelo y avanza hacia la fachada de cristal con las letras doradas DOMENECH. Luz cálida de atardecer, reflejos en el cristal.',
    'Dolly-in suave y cinematográfico. Reflejos realistas en el cristal.',
    'Pixar Studios 3D animated render, exterior of Domenech hair salon, camera starts from ground level, dolly-in towards glass facade with golden DOMENECH lettering, warm afternoon golden hour light, reflections in glass, urban street, cinematic, 4K',
    'Add pedestrians walking past in the background for life and movement.',
    '[{"type": "improve", "text": "Dolly-in desde nivel del suelo para mayor dramatismo"}, {"type": "add", "text": "Transeúntes de fondo para dar vida a la escena"}]',
    5.0, '0:08', '0:13',
    v_bg_ext,
    'low_angle', 'dolly_in',
    'Golden hour, warm afternoon light',
    'Inviting, warm, cinematic',
    'prompt_ready', 2
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E3: Equipo completo -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e3, v_project_id,
    'E3', 'Equipo completo', 'improved', 'presentation', 'build',
    'Los cuatro miembros del equipo de pie juntos con sus herramientas características. José en el centro con blazer azul, Conchi con herramientas de estilismo, Nerea con equipo de prótesis, Raúl con maquinilla. Composición de retrato de equipo.',
    'José en el centro como líder. Cada personaje debe mostrar su herramienta característica. Poses confiadas pero naturales.',
    'Pixar Studios 3D animated render, interior of Domenech salon, all four team members standing together with their signature tools, José in blue blazer center, Conchi with styling tools, Nerea with prosthetic equipment, Raúl with clippers, warm amber lighting, team portrait composition, confident poses, NO DIALOGUE, cinematic, 4K',
    7.0, '0:13', '0:20',
    v_bg_estilismo,
    ARRAY[v_char_jose, v_char_conchi, v_char_nerea, v_char_raul],
    'medium', 'static',
    'Warm amber studio lighting',
    'Confident, professional, united',
    'prompt_ready', 3
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E4A: Pegamento prótesis -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    required_references, reference_tip,
    status, sort_order
  ) VALUES (
    v_scene_e4a, v_project_id,
    'E4A', 'Pegamento prótesis', 'improved', 'prosthesis', 'peak',
    'Primer plano extremo de las manos de Nerea aplicando adhesivo cuidadosamente a una pieza de prótesis capilar. Iluminación suave, profundidad de campo reducida, guantes de látex, movimientos precisos.',
    'Plano muy cerrado en las manos. La precisión y el cuidado deben ser palpables. Momento íntimo y emotivo.',
    'Pixar Studios 3D animated render, extreme close-up of Nerea''s hands carefully applying adhesive to a hair prosthetic piece, soft warm lighting, shallow depth of field, latex gloves, precise movements, intimate emotional moment, NO DIALOGUE, cinematic, 4K',
    8.0, '0:43', '0:50',
    v_bg_pelucas,
    ARRAY[v_char_nerea],
    'extreme_close_up', 'static',
    'Soft warm lighting, shallow depth of field',
    'Intimate, precise, emotional',
    ARRAY['REF-PELUCAS', 'REF-NEREA'],
    'Subir REF-PELUCAS como fondo y REF-NEREA como personaje principal.',
    'prompt_ready', 4
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E4B: Colocación prótesis -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e4b, v_project_id,
    'E4B', 'Colocación prótesis', 'improved', 'prosthesis', 'peak',
    'Plano medio de Nerea colocando la prótesis capilar sobre un cliente masculino. La expresión del cliente cambia de ansiedad a esperanza. Reflejo en espejo visible.',
    'Capturar la transformación emocional del cliente. El espejo debe mostrar el antes/después sutil.',
    'Pixar Studios 3D animated render, medium shot of Nerea placing a hair prosthetic on a male client, client''s expression changing from anxiety to hope, warm lighting, mirror reflection visible, emotional transformation moment, NO DIALOGUE, cinematic, 4K',
    8.0, '0:50', '0:55',
    v_bg_pelucas,
    ARRAY[v_char_nerea],
    'medium', 'static',
    'Warm soft lighting',
    'Emotional, transformative, hopeful',
    'prompt_ready', 5
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E5: Celebración equipo -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e5, v_project_id,
    'E5', 'Celebración equipo', 'improved', 'celebration', 'peak',
    'Los cuatro miembros del equipo celebrando juntos en el salón. José aplaudiendo, Conchi riendo, Nerea sonriendo orgullosa, Raúl levantando el pulgar. Partículas doradas tipo confeti.',
    'Momento de alegría genuina. Cada personaje reacciona de forma característica. Las partículas doradas aportan magia.',
    'Pixar Studios 3D animated render, the four team members celebrating together in the salon, José clapping, Conchi laughing, Nerea smiling proudly, Raúl giving thumbs up, warm golden lighting, confetti-like gold particles, joyful atmosphere, NO DIALOGUE, cinematic, 4K',
    5.0, '0:58', '1:05',
    v_bg_estilismo,
    ARRAY[v_char_jose, v_char_conchi, v_char_nerea, v_char_raul],
    'medium', 'static',
    'Warm golden lighting with gold particles',
    'Joyful, celebratory, triumphant',
    'prompt_ready', 6
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E6: Estilismo general -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e6, v_project_id,
    'E6', 'Estilismo en acción', 'original', 'service', 'build',
    'Montaje rápido de servicios de estilismo: José y Conchi trabajando en paralelo en sus estaciones, tijeras cortando, secador en movimiento.',
    'Montaje dinámico que muestre la energía del salón. Cortes rápidos entre estaciones.',
    'Pixar Studios 3D animated render, dynamic montage of Domenech salon in action, José and Conchi working at styling stations, scissors cutting hair, blow dryer in motion, multiple angles, warm amber lighting, energetic atmosphere, NO DIALOGUE, cinematic, 4K',
    5.0,
    v_bg_estilismo,
    ARRAY[v_char_jose, v_char_conchi, v_char_raul],
    'medium', 'tracking',
    'Warm amber studio lighting',
    'Energetic, dynamic, professional',
    'prompt_ready', 7
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E7: Barbería Raúl -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e7, v_project_id,
    'E7', 'Barbería Raúl', 'original', 'service', 'build',
    'Raúl realizando un degradado perfecto con maquinilla. Concentración y precisión en cada pasada.',
    'Primer plano de la maquinilla trabajando. Mostrar la habilidad técnica de Raúl.',
    'Pixar Studios 3D animated render, close-up of Raúl performing a perfect fade haircut with clippers, precise movements, hair falling, concentrated expression, warm lighting, barbershop atmosphere, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_raul],
    'close_up', 'static',
    'Warm directional lighting',
    'Focused, precise, skilled',
    'prompt_ready', 8
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E7B: Conchi coloración -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e7b, v_project_id,
    'E7B', 'Conchi coloración', 'original', 'service', 'build',
    'Conchi aplicando coloración con pincel y cuenco, movimientos expertos y sonrisa cálida hacia la clienta.',
    'Mostrar la cercanía de Conchi con la clienta mientras trabaja.',
    'Pixar Studios 3D animated render, medium shot of Conchi applying hair color with brush and bowl, expert movements, warm smile to female client, styling station with mirror, warm amber lighting, caring atmosphere, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_conchi],
    'medium', 'static',
    'Warm amber lighting',
    'Caring, professional, warm',
    'prompt_ready', 9
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E7C: Nerea consulta -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e7c, v_project_id,
    'E7C', 'Nerea consulta prótesis', 'original', 'service', 'build',
    'Nerea en consulta privada mostrando opciones de prótesis capilar a un cliente, con cabezas de maniquí de fondo.',
    'Intimidad del espacio de consulta. Nerea explicando con empatía.',
    'Pixar Studios 3D animated render, Nerea in private consultation showing hair prosthetic options to a male client, mannequin heads with different hair pieces in background, soft warm lighting, empathetic expression, intimate setting, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_pelucas,
    ARRAY[v_char_nerea],
    'medium', 'static',
    'Soft warm lighting',
    'Intimate, empathetic, professional',
    'prompt_ready', 10
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E7D: Raúl navaja -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e7d, v_project_id,
    'E7D', 'Raúl afeitado navaja', 'original', 'service', 'build',
    'Raúl realizando un afeitado clásico con navaja. Espuma, navaja deslizándose, ritual de barbería clásica.',
    'Plano cerrado del afeitado. Ritual y tradición.',
    'Pixar Studios 3D animated render, close-up of Raúl performing a classic straight razor shave, shaving foam, razor gliding smoothly, classic barbershop ritual, warm lighting, focused expression, tattooed arm visible, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_raul],
    'close_up', 'static',
    'Warm directional lighting',
    'Classic, ritualistic, skilled',
    'prompt_ready', 11
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E8: Montaje final -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e8, v_project_id,
    'E8', 'Montaje final resultados', 'original', 'celebration', 'peak',
    'Montaje rápido de clientes satisfechos mirándose al espejo, tocándose el pelo con felicidad. Transformaciones completadas.',
    'Cortes rápidos entre distintos clientes satisfechos. Emociones genuinas de felicidad.',
    'Pixar Studios 3D animated render, quick montage of satisfied clients looking at themselves in mirrors, touching their hair with happiness, multiple transformations complete, warm golden lighting, joyful expressions, Domenech salon setting, NO DIALOGUE, cinematic, 4K',
    5.0, '1:05', '1:10',
    v_bg_estilismo,
    ARRAY[v_char_jose],
    'medium', 'tracking',
    'Warm golden lighting',
    'Satisfied, happy, transformed',
    'prompt_ready', 12
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- E9: CTA Final -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_e9, v_project_id,
    'E9', 'CTA Final', 'original', 'cta', 'close',
    'Exterior del salón Domenech al atardecer. La palabra DOMENECH brilla en la fachada. Aparece tagline: "Tu mejor versión empieza aquí".',
    'Plano final estático y elegante. El tagline debe ser legible y memorable.',
    'Pixar Studios 3D animated render, exterior of Domenech salon at golden hour, the word DOMENECH glowing on the facade, tagline appearing: ''Tu mejor versión empieza aquí'', warm cinematic lighting, invitation to visit, NO DIALOGUE, 4K',
    5.0, '1:15', '1:20',
    v_bg_ext,
    'medium', 'static',
    'Golden hour, warm cinematic lighting',
    'Inviting, warm, memorable',
    'prompt_ready', 13
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N1: Cold open tijeras -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    camera_angle, camera_movement,
    lighting, mood, sound_notes,
    status, sort_order
  ) VALUES (
    v_scene_n1, v_project_id,
    'N1', 'Cold open tijeras', 'new', 'intro', 'hook',
    'Primer plano extremo de tijeras profesionales abriéndose y cerrándose en cámara lenta. Un solo mechón dorado siendo cortado. Fondo negro, iluminación lateral dramática.',
    'ASMR visual. Sonido de tijeras amplificado. Sin música, solo el corte.',
    'Pixar Studios 3D animated render, extreme close-up of professional hairdressing scissors opening and closing in slow motion, single golden hair strand being cut, black background, dramatic side lighting, ASMR feel, NO DIALOGUE, cinematic, 4K',
    3.0, '0:00', '0:03',
    'extreme_close_up', 'static',
    'Dramatic side lighting, black background',
    'Dramatic, ASMR, attention-grabbing',
    'Solo sonido amplificado de tijeras cortando. Sin música.',
    'prompt_ready', 14
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N2: Letrero desde dentro -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n2, v_project_id,
    'N2', 'Letrero desde dentro', 'new', 'presentation', 'build',
    'Vista desde el interior del salón mirando hacia fuera a través del cristal. Las letras DOMENECH se leen al revés en el cristal con la calle de fondo.',
    'Perspectiva inusual que invita al espectador a estar dentro del salón.',
    'Pixar Studios 3D animated render, view from inside Domenech salon looking out through glass door, DOMENECH letters seen reversed on glass, street visible outside, warm interior vs cool exterior light contrast, inviting perspective, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_ext,
    'medium', 'static',
    'Warm interior vs cool exterior contrast',
    'Inviting, curious, transitional',
    'prompt_ready', 15
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N3: Herramientas beauty shot -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n3, v_project_id,
    'N3', 'Herramientas beauty shot', 'new', 'presentation', 'build',
    'Plano cenital de herramientas de peluquería dispuestas artísticamente: tijeras, peines, secador, maquinilla, pinceles de coloración.',
    'Composición tipo flat-lay. Herramientas como obras de arte.',
    'Pixar Studios 3D animated render, overhead bird''s eye view of hairdressing tools artistically arranged on dark surface, scissors, combs, blow dryer, clippers, color brushes, dramatic top-down lighting, product photography style, NO DIALOGUE, cinematic, 4K',
    3.0,
    'birds_eye', 'static',
    'Dramatic top-down lighting',
    'Artistic, premium, professional',
    'prompt_ready', 16
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N4: Conchi secador cámara lenta -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n4, v_project_id,
    'N4', 'Conchi secador cámara lenta', 'new', 'service', 'build',
    'Conchi usando el secador rose gold en cámara lenta. El pelo de la clienta se mueve con el aire como en un anuncio de champú.',
    'Slow motion glamuroso. El pelo debe moverse de forma espectacular.',
    'Pixar Studios 3D animated render, slow motion shot of Conchi using rose gold blow dryer, client''s hair flowing dramatically in the air like a shampoo commercial, warm backlighting, hair catching light beautifully, glamorous feel, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_conchi],
    'medium', 'static',
    'Warm backlighting, hair catching light',
    'Glamorous, slow-motion, beautiful',
    'prompt_ready', 17
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N5: José recibiendo cliente -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n5, v_project_id,
    'N5', 'José recibiendo cliente', 'new', 'service', 'build',
    'José recibiendo a un cliente en la entrada con un apretón de manos cálido y su sonrisa característica.',
    'Calidez y profesionalidad. El cliente se siente bienvenido.',
    'Pixar Studios 3D animated render, José in blue blazer warmly greeting a client at the salon entrance with a handshake, confident warm smile, welcoming atmosphere, Domenech salon interior visible behind, warm lighting, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_jose],
    'medium', 'static',
    'Warm welcoming lighting',
    'Welcoming, warm, professional',
    'prompt_ready', 18
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N6: Beauty shot prótesis -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n6, v_project_id,
    'N6', 'Beauty shot prótesis', 'new', 'prosthesis', 'peak',
    'Plano detalle de una prótesis capilar terminada sobre un maniquí, iluminada como una joya. Calidad y artesanía visibles.',
    'La prótesis como obra de arte. Iluminación de producto de lujo.',
    'Pixar Studios 3D animated render, beauty shot of a finished hair prosthetic piece on a mannequin head, lit like a luxury product, soft warm spotlight, dark background, every hair strand visible, artisan quality, NO DIALOGUE, cinematic, 4K',
    3.0, '0:38', '0:43',
    v_bg_pelucas,
    'close_up', 'static',
    'Soft warm spotlight, dark background',
    'Luxurious, artisan, premium',
    'prompt_ready', 19
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N7: Reveal prótesis -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds, start_time, end_time,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n7, v_project_id,
    'N7', 'Reveal prótesis completada', 'new', 'prosthesis', 'peak',
    'Momento del reveal: el cliente se ve por primera vez con la prótesis puesta. Emoción contenida, posible lágrima. Nerea sonriendo detrás.',
    'El momento más emotivo del vídeo. La cámara debe capturar la reacción del cliente.',
    'Pixar Studios 3D animated render, emotional reveal moment, male client seeing himself for the first time with hair prosthetic in mirror, tears of joy, Nerea smiling proudly behind him, warm soft lighting, intimate moment, NO DIALOGUE, cinematic, 4K',
    3.0, '0:55', '0:58',
    v_bg_pelucas,
    ARRAY[v_char_nerea],
    'medium', 'static',
    'Warm soft intimate lighting',
    'Deeply emotional, transformative, tearful joy',
    'prompt_ready', 20
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N8: Raúl y José trabajando juntos -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n8, v_project_id,
    'N8', 'Raúl y José en acción', 'new', 'service', 'build',
    'Raúl y José trabajando en estaciones contiguas, intercambiando una mirada cómplice y una sonrisa. Equipo en armonía.',
    'Mostrar la complicidad entre padre e hijo / jefe y barbero.',
    'Pixar Studios 3D animated render, Raúl and José working at adjacent styling stations, exchanging a knowing glance and smile, team harmony, warm amber lighting, busy salon atmosphere, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_jose, v_char_raul],
    'medium', 'pan_left',
    'Warm amber lighting',
    'Harmonious, team spirit, professional',
    'prompt_ready', 21
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- N9: Raúl detalle degradado -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description, director_notes,
    prompt_image,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    lighting, mood,
    status, sort_order
  ) VALUES (
    v_scene_n9, v_project_id,
    'N9', 'Raúl detalle degradado', 'new', 'service', 'build',
    'Plano macro del degradado perfecto que está realizando Raúl. El pelo corto se degrada impecablemente.',
    'Plano extremo detalle mostrando la precisión del corte.',
    'Pixar Studios 3D animated render, extreme macro close-up of a perfect fade haircut being performed by Raúl, hair gradually transitioning from short to shorter, clippers precision, individual hairs visible, dramatic side lighting, NO DIALOGUE, cinematic, 4K',
    3.0,
    v_bg_estilismo,
    ARRAY[v_char_raul],
    'extreme_close_up', 'static',
    'Dramatic side lighting',
    'Precise, detailed, ASMR',
    'prompt_ready', 22
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- R1: Transición ondas -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_image,
    duration_seconds,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_r1, v_project_id,
    'R1', 'Transición ondas de pelo', 'filler', 'transition', 'build',
    'Transición visual: ondas de pelo dorado moviéndose como olas de mar, transición fluida entre secciones.',
    'Pixar Studios 3D animated render, golden hair waves flowing like ocean waves, smooth transition element, dark background, volumetric golden light, abstract hair movement, cinematic, 4K',
    2.0,
    'medium', 'static',
    'draft', 23
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- R2: Título servicios -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_image,
    duration_seconds,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_r2, v_project_id,
    'R2', 'Título: Nuestros Servicios', 'filler', 'transition', 'build',
    'Rótulo elegante con texto "Nuestros Servicios" sobre fondo oscuro con partículas doradas.',
    'Pixar Studios 3D animated render, elegant title card reading "Nuestros Servicios" in golden calligraphy, dark background, floating gold particles, warm volumetric light, cinematic, 4K',
    2.0,
    'medium', 'static',
    'draft', 24
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- R3: Tagline -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_image,
    duration_seconds, start_time, end_time,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_r3, v_project_id,
    'R3', 'Tagline: Tu mejor versión', 'filler', 'transition', 'close',
    'Rótulo con tagline "Tu mejor versión empieza aquí" apareciendo letra a letra sobre fondo elegante.',
    'Pixar Studios 3D animated render, elegant title card, text "Tu mejor versión empieza aquí" appearing letter by letter in golden typography, dark warm background, subtle gold particles, cinematic, 4K',
    5.0, '1:10', '1:15',
    'medium', 'static',
    'draft', 25
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- R4: Título prótesis -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_image,
    duration_seconds, start_time, end_time,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_r4, v_project_id,
    'R4', 'Título: Prótesis Capilares', 'filler', 'transition', 'peak',
    'Rótulo elegante con texto "Prótesis Capilares" introduciendo la sección de especialidad.',
    'Pixar Studios 3D animated render, elegant title card reading "Prótesis Capilares" in golden calligraphy, dark background, soft golden glow, transitioning to the specialty section, cinematic, 4K',
    3.0, '0:35', '0:38',
    'medium', 'static',
    'draft', 26
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- V6: Video estilismo -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_video,
    duration_seconds,
    background_id,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_v6, v_project_id,
    'V6', 'Video estilismo en movimiento', 'video', 'service', 'build',
    'Versión en vídeo del estilismo en acción, con movimiento de cámara tracking a través del salón.',
    'Pixar Studios 3D animated video, tracking shot through Domenech salon, stylists working at stations, dynamic camera movement, warm amber lighting, busy salon atmosphere, smooth motion, cinematic, 4K',
    5.0,
    v_bg_estilismo,
    'medium', 'tracking',
    'draft', 27
  ) ON CONFLICT (id) DO NOTHING;

  -- ----- V7: Video barbería -----
  INSERT INTO public.scenes (
    id, project_id, scene_number, title, scene_type, category, arc_phase,
    description,
    prompt_video,
    duration_seconds,
    background_id, character_ids,
    camera_angle, camera_movement,
    status, sort_order
  ) VALUES (
    v_scene_v7, v_project_id,
    'V7', 'Video barbería Raúl', 'video', 'service', 'build',
    'Versión en vídeo de Raúl realizando un corte de barbería, con movimiento fluido de cámara.',
    'Pixar Studios 3D animated video, Raúl performing a barbershop haircut, clippers buzzing, hair falling, smooth orbit camera movement, warm lighting, professional barbershop atmosphere, cinematic, 4K',
    5.0,
    v_bg_estilismo,
    ARRAY[v_char_raul],
    'close_up', 'orbit',
    'draft', 28
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 6. NARRATIVE ARCS (6)
  -- =============================================

  -- Arc 1: Gancho
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_1, v_project_id,
    'hook', 1,
    'Gancho',
    'Apertura impactante con plano ASMR de tijeras y logo reveal dorado. Captura la atención en los primeros 5 segundos.',
    0, 5,
    ARRAY['N1', 'E1'],
    '#E24B4A', 'bolt',
    1
  ) ON CONFLICT (id) DO NOTHING;

  -- Arc 2: Presentación
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_2, v_project_id,
    'build', 2,
    'Presentación',
    'Introducción del salón (exterior) y presentación del equipo completo. Establece el contexto y presenta a los protagonistas.',
    5, 15,
    ARRAY['E2', 'E3'],
    '#BA7517', 'users',
    2
  ) ON CONFLICT (id) DO NOTHING;

  -- Arc 3: Servicios
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_3, v_project_id,
    'build', 3,
    'Servicios',
    'Montaje dinámico de los servicios principales: estilismo, barbería, coloración. Muestra la variedad y calidad del equipo.',
    15, 35,
    ARRAY['E6', 'E7', 'E7B', 'E7C', 'E7D', 'N8', 'N9'],
    '#BA7517', 'scissors',
    3
  ) ON CONFLICT (id) DO NOTHING;

  -- Arc 4: Especialidad
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_4, v_project_id,
    'peak', 4,
    'Especialidad',
    'La sección más emotiva: prótesis capilares. Proceso detallado desde la consulta hasta el reveal transformador.',
    35, 55,
    ARRAY['E4A', 'E4B', 'N6', 'N7'],
    '#1D9E75', 'heart',
    4
  ) ON CONFLICT (id) DO NOTHING;

  -- Arc 5: Transformación
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_5, v_project_id,
    'peak', 5,
    'Transformación',
    'Celebración del equipo y montaje de resultados finales. El clímax emocional del vídeo.',
    55, 65,
    ARRAY['E5', 'E8'],
    '#1D9E75', 'sparkles',
    5
  ) ON CONFLICT (id) DO NOTHING;

  -- Arc 6: CTA
  INSERT INTO public.narrative_arcs (
    id, project_id, phase, phase_number, title, description,
    start_second, end_second, scene_numbers, color, icon, sort_order
  ) VALUES (
    v_arc_6, v_project_id,
    'close', 6,
    'CTA',
    'Llamada a la acción final con el salón al atardecer y tagline: "Tu mejor versión empieza aquí".',
    65, 75,
    ARRAY['E9'],
    '#185FA5', 'phone',
    6
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================
  -- 7. TIMELINE ENTRIES (15)
  -- =============================================

  INSERT INTO public.timeline_entries (project_id, scene_id, title, description, start_time, end_time, duration_seconds, arc_phase, phase_color, sort_order) VALUES
    (v_project_id, v_scene_n1, 'Cold open tijeras', 'Plano ASMR de tijeras cortando un mechón dorado. Captura atención inmediata.', '0:00', '0:03', 3.0, 'hook', '#E24B4A', 1),
    (v_project_id, v_scene_e1, 'Logo reveal', 'Mechón dorado se convierte en letras DOMENECH. Identidad de marca.', '0:03', '0:08', 5.0, 'hook', '#E24B4A', 2),
    (v_project_id, v_scene_e2, 'Exterior salón', 'Dolly-in hacia la fachada. Establece ubicación.', '0:08', '0:13', 5.0, 'build', '#BA7517', 3),
    (v_project_id, v_scene_e3, 'Equipo completo', 'Retrato del equipo de 4 profesionales.', '0:13', '0:20', 7.0, 'build', '#BA7517', 4),
    (v_project_id, v_scene_e6, 'Montaje servicios', 'Montaje dinámico: estilismo, barbería, coloración (E6, E7, E7B, E7C, E7D, N8, N9).', '0:20', '0:35', 15.0, 'build', '#BA7517', 5),
    (v_project_id, v_scene_r4, 'Título prótesis', 'Rótulo introductorio de la sección de prótesis capilares.', '0:35', '0:38', 3.0, 'peak', '#1D9E75', 6),
    (v_project_id, v_scene_n6, 'Beauty shot prótesis', 'Plano detalle de prótesis terminada. Calidad artesanal.', '0:38', '0:43', 5.0, 'peak', '#1D9E75', 7),
    (v_project_id, v_scene_e4a, 'Pegamento prótesis', 'Close-up de Nerea aplicando adhesivo. Precisión.', '0:43', '0:50', 7.0, 'peak', '#1D9E75', 8),
    (v_project_id, v_scene_e4b, 'Colocación prótesis', 'Nerea coloca prótesis en cliente. Transformación.', '0:50', '0:55', 5.0, 'peak', '#1D9E75', 9),
    (v_project_id, v_scene_n7, 'Reveal prótesis', 'Cliente se ve por primera vez. Momento emotivo.', '0:55', '0:58', 3.0, 'peak', '#1D9E75', 10),
    (v_project_id, v_scene_e5, 'Celebración equipo', 'Los 4 profesionales celebrando juntos.', '0:58', '1:05', 7.0, 'peak', '#1D9E75', 11),
    (v_project_id, v_scene_e8, 'Montaje final', 'Clientes satisfechos mirándose al espejo.', '1:05', '1:10', 5.0, 'peak', '#1D9E75', 12),
    (v_project_id, v_scene_r3, 'Tagline', '"Tu mejor versión empieza aquí" apareciendo.', '1:10', '1:15', 5.0, 'close', '#185FA5', 13),
    (v_project_id, v_scene_e9, 'CTA exterior', 'Fachada al atardecer con DOMENECH brillando.', '1:15', '1:20', 5.0, 'close', '#185FA5', 14),
    (v_project_id, v_scene_e1, 'Logo final', 'Cierre con logo DOMENECH y datos de contacto.', '1:20', '1:25', 5.0, 'close', '#185FA5', 15);

  -- =============================================
  -- 8. PROJECT ISSUES (9)
  -- =============================================

  -- Strengths (3)
  INSERT INTO public.project_issues (project_id, issue_type, title, description, category, priority, sort_order) VALUES
    (v_project_id, 'strength', 'Prompts técnicos muy sólidos', 'Los prompts de imagen están bien estructurados con estilo Pixar consistente, iluminación definida, y directivas claras de composición. El uso de "NO DIALOGUE" y "cinematic, 4K" es acertado.', 'prompts', 0, 1),
    (v_project_id, 'strength', 'Secuencia de prótesis capilar sobresaliente', 'La progresión E4A → E4B → N7 (pegamento → colocación → reveal) construye una narrativa emotiva excepcional que diferencia al negocio de la competencia.', 'narrative', 0, 2),
    (v_project_id, 'strength', 'Arco narrativo bien estructurado', 'La estructura de 6 fases (gancho → presentación → servicios → especialidad → transformación → CTA) sigue las mejores prácticas de storytelling publicitario.', 'narrative', 0, 3);

  -- Warnings (3)
  INSERT INTO public.project_issues (project_id, issue_type, title, description, category, priority, sort_order) VALUES
    (v_project_id, 'warning', 'El gancho inicial es demasiado suave', 'Los primeros 3-5 segundos necesitan más impacto para retener al espectador en YouTube. Considerar un cold open más dramático o un antes/después impactante.', 'pacing', 2, 4),
    (v_project_id, 'warning', 'Falta variedad en ángulos de cámara', 'Muchas escenas usan plano medio estático. Añadir más variedad: cenital, POV, over-shoulder, tracking lateral para mantener el interés visual.', 'visual', 1, 5),
    (v_project_id, 'warning', 'Transiciones entre secciones abruptas', 'Las transiciones entre las secciones de servicios y prótesis necesitan suavizarse. Los rótulos (R2, R4) ayudan pero podrían beneficiarse de transiciones visuales.', 'pacing', 1, 6);

  -- Suggestions (3)
  INSERT INTO public.project_issues (project_id, issue_type, title, description, category, priority, sort_order) VALUES
    (v_project_id, 'suggestion', 'Añadir momento antes/después visual', 'Un split-screen o transición antes/después de un cliente de prótesis capilar sería tremendamente impactante y compartible en redes sociales.', 'narrative', 0, 7),
    (v_project_id, 'suggestion', 'Incluir escena de atención al cliente', 'Falta una escena que muestre la experiencia del cliente desde la llegada: recepción, consulta, café. Humaniza el negocio.', 'narrative', 0, 8),
    (v_project_id, 'suggestion', 'Considerar versión corta para Instagram', 'Con 75s de material, se puede hacer un corte de 30s para Instagram Reels/TikTok usando solo las escenas más impactantes (N1, E4A, N7, E9).', 'pacing', 0, 9);

  -- =============================================
  -- 9. RECALCULATE PROJECT STATS
  -- =============================================
  PERFORM public.recalc_project_stats(v_project_id);

END;
$$;

COMMIT;
