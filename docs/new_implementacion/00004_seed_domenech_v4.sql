-- =============================================
-- Kiyoko AI v4 — Seed: Proyecto Demo Domenech
-- Migration: 00004_seed_domenech_v4.sql
-- Schema: New v4 architecture (Project → Video → Scene)
-- =============================================
-- Uses nanoid 12-char short IDs for URL routing.
-- User: 87125c6e-71ff-4c0d-9978-c37b58e6b69d
-- Video: 90 seconds, YouTube, Pixar 3D
-- AI Generator: Grok (6s base clips, supports extension from last frame)
-- =============================================

BEGIN;

DO $$
DECLARE
  -- =============================================
  -- 0. FIXED UUIDs + SHORT IDs
  -- =============================================
  v_owner_id        UUID := '87125c6e-71ff-4c0d-9978-c37b58e6b69d';

  -- Project
  v_project_id      UUID := gen_random_uuid();
  v_project_sid     TEXT := 'pDm3nKqR8xWz';  -- nanoid for /project/pDm3nKqR8xWz

  -- AI Settings & Agent
  v_ai_settings_id  UUID := gen_random_uuid();
  v_ai_agent_id     UUID := gen_random_uuid();

  -- Style Preset
  v_style_id        UUID := gen_random_uuid();

  -- Characters
  v_char_jose       UUID := gen_random_uuid();
  v_char_conchi     UUID := gen_random_uuid();
  v_char_nerea      UUID := gen_random_uuid();
  v_char_raul       UUID := gen_random_uuid();

  -- Backgrounds
  v_bg_ext          UUID := gen_random_uuid();
  v_bg_pelucas      UUID := gen_random_uuid();
  v_bg_estilismo    UUID := gen_random_uuid();

  -- Video
  v_video_id        UUID := gen_random_uuid();
  v_video_sid       TEXT := 'vYt90sDm3nKq';  -- nanoid for /project/.../video/vYt90sDm3nKq

  -- Scenes (16 scenes for 90s video)
  v_sc_n1           UUID := gen_random_uuid(); -- Cold open scissors
  v_sc_e1           UUID := gen_random_uuid(); -- Logo reveal
  v_sc_e2           UUID := gen_random_uuid(); -- Exterior dolly-in
  v_sc_e3           UUID := gen_random_uuid(); -- Team portrait
  v_sc_e6           UUID := gen_random_uuid(); -- Styling montage
  v_sc_e7           UUID := gen_random_uuid(); -- Raúl barbershop
  v_sc_e7b          UUID := gen_random_uuid(); -- Conchi coloring
  v_sc_e7c          UUID := gen_random_uuid(); -- Nerea consultation
  v_sc_r4           UUID := gen_random_uuid(); -- Title: prosthetics
  v_sc_e4a          UUID := gen_random_uuid(); -- Prosthetic glue
  v_sc_e4b          UUID := gen_random_uuid(); -- Prosthetic placement
  v_sc_n7           UUID := gen_random_uuid(); -- Reveal
  v_sc_e5           UUID := gen_random_uuid(); -- Team celebration
  v_sc_e8           UUID := gen_random_uuid(); -- Final montage
  v_sc_r3           UUID := gen_random_uuid(); -- Tagline
  v_sc_e9           UUID := gen_random_uuid(); -- CTA exterior

  -- Video clips (base + extensions)
  v_clip_n1         UUID := gen_random_uuid();
  v_clip_e1         UUID := gen_random_uuid();
  v_clip_e2         UUID := gen_random_uuid();
  v_clip_e3_base    UUID := gen_random_uuid();
  v_clip_e3_ext1    UUID := gen_random_uuid();
  v_clip_e6         UUID := gen_random_uuid();
  v_clip_e7         UUID := gen_random_uuid();
  v_clip_e7b        UUID := gen_random_uuid();
  v_clip_e7c        UUID := gen_random_uuid();
  v_clip_r4         UUID := gen_random_uuid();
  v_clip_e4a_base   UUID := gen_random_uuid();
  v_clip_e4a_ext1   UUID := gen_random_uuid();
  v_clip_e4b_base   UUID := gen_random_uuid();
  v_clip_e4b_ext1   UUID := gen_random_uuid();
  v_clip_n7         UUID := gen_random_uuid();
  v_clip_e5_base    UUID := gen_random_uuid();
  v_clip_e5_ext1    UUID := gen_random_uuid();
  v_clip_e8         UUID := gen_random_uuid();
  v_clip_r3         UUID := gen_random_uuid();
  v_clip_e9         UUID := gen_random_uuid();

  -- Video narration & analysis
  v_narration_id    UUID := gen_random_uuid();
  v_analysis_id     UUID := gen_random_uuid();

  -- AI Conversation
  v_conv_id         UUID := gen_random_uuid();

  -- Social profiles
  v_social_ig       UUID := gen_random_uuid();
  v_social_tk       UUID := gen_random_uuid();

  -- Publications
  v_pub_1           UUID := gen_random_uuid();
  v_pub_2           UUID := gen_random_uuid();
  v_pub_3           UUID := gen_random_uuid();

  -- Narrative arcs
  v_arc_1           UUID := gen_random_uuid();
  v_arc_2           UUID := gen_random_uuid();
  v_arc_3           UUID := gen_random_uuid();
  v_arc_4           UUID := gen_random_uuid();
  v_arc_5           UUID := gen_random_uuid();
  v_arc_6           UUID := gen_random_uuid();

BEGIN

  -- =============================================
  -- 1. PROFILE (upsert — user already exists in auth)
  -- =============================================
  INSERT INTO public.profiles (id, email, full_name, role, bio, company)
  VALUES (
    v_owner_id,
    'desarrollador@kiyoko.ai',
    'Desarrollador Kiyoko',
    'admin',
    'Cuenta principal de desarrollo de Kiyoko AI.',
    'Kiyoko AI'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- =============================================
  -- 2. PROJECT
  -- =============================================
  INSERT INTO public.projects (
    id, short_id, owner_id,
    title, slug, description, status,
    style, custom_style_description, color_palette, global_prompt_rules,
    client_name, client_logo_url,
    cover_image_url, tags, is_demo,
    ai_brief
  ) VALUES (
    v_project_id, v_project_sid, v_owner_id,
    'Domenech Peluquerías',
    'domenech-peluquerias',
    'Vídeo promocional estilo Pixar 3D para Domenech Peluquerías. Presenta al equipo de 4 profesionales, servicios de estilismo y barbería, y especialidad en prótesis capilares. Orientado a YouTube con adaptaciones para TikTok e Instagram.',
    'in_progress',
    'pixar',
    'Estilo Pixar 3D con iluminación cálida ámbar, sombras suaves, texturas realistas. Personalizado para reflejar la calidez y profesionalidad de una peluquería familiar de alta gama.',
    '{"primary":"#C8A96E","secondary":"#E8943A","accent":"#F5EDD8","dark":"#2A1A0A","light":"#FFF8EB"}',
    'Siempre estilo Pixar Studios 3D animation. Iluminación cálida ámbar. Sin texto en las imágenes generadas. Sin diálogo visible. Calidad cinematográfica 4K. Los personajes deben mantener proporciones Pixar: cabezas ligeramente grandes, ojos expresivos, rasgos estilizados pero reconocibles.',
    'Domenech Peluquerías',
    NULL,
    NULL,
    ARRAY['peluquería','pixar','prótesis capilar','barbería','estilismo','YouTube','demo'],
    TRUE,
    'Somos Domenech Peluquerías, una peluquería familiar con 4 profesionales: José (director, corpulento, blazer azul, carismático), Conchi (estilista senior, rubia, cálida), Nerea (especialista en prótesis capilares, joven, meticulosa) y Raúl (barbero, tatuajes, moderno). Queremos un vídeo de 90 segundos para YouTube estilo Pixar 3D que muestre nuestros servicios y especialmente las prótesis capilares, que es lo que nos diferencia. El tono debe ser cálido, profesional y emotivo en la sección de prótesis.'
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 3. PROJECT AI SETTINGS
  -- =============================================
  INSERT INTO public.project_ai_settings (
    id, project_id,
    image_provider, image_provider_config,
    video_provider, video_provider_url, video_provider_config,
    video_base_duration_seconds, video_alt_duration_seconds,
    video_supports_extension, video_extension_duration_seconds,
    tts_provider, tts_provider_config,
    vision_provider, vision_model
  ) VALUES (
    v_ai_settings_id, v_project_id,
    'grok_aurora',
    '{"model":"grok-2-aurora","quality":"high","size":"1024x1024","style":"pixar-3d"}',
    'grok',
    'https://x.ai/api',
    '{"model":"grok-video","quality":"high","resolution":"1080p","fps":24}',
    6,    -- Base: 6 seconds per clip
    10,   -- Alt: 10 seconds available
    TRUE, -- Grok supports extending from last frame
    6,    -- Each extension adds 6 seconds
    'elevenlabs',
    '{"model":"eleven_multilingual_v2","voice_id":"pNInz6obpgDQGcFmaJgB","language":"es"}',
    'openai',
    'gpt-4o'
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 4. PROJECT AI AGENT
  -- =============================================
  INSERT INTO public.project_ai_agents (
    id, project_id,
    name, system_prompt,
    tone, creativity_level, language,
    video_style_context, is_default
  ) VALUES (
    v_ai_agent_id, v_project_id,
    'Director Pixar — Domenech',
    'Eres Kiyoko, una directora de vídeo de animación 3D estilo Pixar Studios. Trabajas para Domenech Peluquerías, una peluquería familiar de alta gama especializada en prótesis capilares.

Tu rol es dirigir la creación de vídeos promocionales con estas directrices:
- ESTILO VISUAL: Pixar Studios 3D animation, iluminación cálida ámbar, sombras suaves, texturas hiperrealistas en pelo y telas.
- TONO: Cálido y profesional para servicios generales. Emotivo e íntimo para la sección de prótesis capilares.
- PERSONAJES: 4 profesionales con personalidades definidas. José es el líder carismático, Conchi transmite calidez maternal, Nerea es meticulosa y empática, Raúl es moderno y enérgico.
- PRÓTESIS CAPILARES: Esta es la especialidad diferenciadora. Las escenas de prótesis deben ser el clímax emocional.
- AUDIENCIA: Clientes potenciales de peluquería en España, especialmente personas con alopecia.
- PROMPTS: Todos los prompts en inglés, comenzando con "Pixar Studios 3D animated render,". Terminar con "NO DIALOGUE, cinematic, 4K". Sin texto en imagen.

Cuando crees escenas, siempre pregunta primero qué quiere ver el cliente. Si no lo sabe, sugiere basándote en el contexto narrativo y las escenas adyacentes. Siempre explica tus decisiones de cámara y estilo.',
    'warm_professional',
    0.8,
    'es',
    'pixar_3d_animation',
    TRUE
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 5. STYLE PRESET
  -- =============================================
  INSERT INTO public.style_presets (
    id, project_id,
    name, style_type, description,
    prompt_prefix, prompt_suffix, negative_prompt,
    color_palette, is_default
  ) VALUES (
    v_style_id, v_project_id,
    'Pixar Domenech Cálido',
    'pixar',
    'Estilo Pixar 3D con la paleta dorada de Domenech. Iluminación ámbar, sombras suaves, texturas realistas de pelo.',
    'Pixar Studios 3D animated render,',
    'warm amber lighting, cinematic composition, shallow depth of field, NO DIALOGUE, cinematic, 4K',
    'text, watermark, blurry, deformed, low quality, dark, gloomy, flat lighting, 2D, cartoon, anime, sketch',
    '["#C8A96E","#E8943A","#F5EDD8","#2A1A0A","#FFF8EB"]',
    TRUE
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 6. CHARACTERS (4)
  -- =============================================

  INSERT INTO public.characters (
    id, project_id, name, initials, role, description,
    visual_description, personality,
    signature_clothing, hair_description, accessories, signature_tools,
    color_accent, prompt_snippet,
    ai_prompt_description,
    ai_visual_analysis,
    rules, sort_order
  ) VALUES
  -- JOSÉ
  (v_char_jose, v_project_id,
   'José', 'JO', 'Director · El jefe',
   'Dueño y director de Domenech Peluquerías. Presencia imponente y carismática. Lidera el equipo con confianza y calidez.',
   'Hombre corpulento y confiado, pelo castaño rojizo peinado hacia atrás con pecas, blazer azul acero sobre camisa negra, collar de plata, sonrisa cálida.',
   'Confiado, cálido, líder natural, carismático',
   'Blazer azul acero sobre camisa negra',
   'Pelo castaño rojizo peinado hacia atrás',
   ARRAY['collar de plata','pulseras'],
   ARRAY['tijeras profesionales'],
   '#3B82F6',
   'a heavyset confident man, auburn-brown swept-back hair, freckles, wearing a blue steel blazer over a black shirt, silver necklace, warm smile',
   'Heavyset confident middle-aged man with auburn-brown swept-back hair and freckles across nose and cheeks. Wearing a tailored blue steel blazer over a fitted black shirt with a silver chain necklace. Broad shoulders, warm genuine smile, expressive brown eyes. Pixar-style slightly oversized head with warm lighting accentuating his welcoming presence.',
   '{"age_range":"42-50","body_type":"heavyset","facial_features":"freckles, broad jaw, warm brown eyes","hair":"auburn-brown, swept back","clothing":"blue steel blazer, black shirt","accessories":["silver necklace","bracelets"],"expression":"confident, warm smile","pose":"leader stance"}',
   '{"always":"Siempre con blazer azul. Siempre en posición central cuando aparece con el equipo.","never":"Nunca con expresión seria o enfadada. Nunca sin el collar de plata."}',
   1),
  -- CONCHI
  (v_char_conchi, v_project_id,
   'Conchi', 'CO', 'Estilista senior',
   'Estilista senior con años de experiencia. Transmite calidez y confianza a los clientes. Especialista en coloración y corte femenino.',
   'Mujer cálida de mediana edad, pelo rubio rizado por encima del hombro, jersey rosa sobre camisa blanca, sonrisa amable.',
   'Cálida, cercana, profesional, maternal',
   'Jersey rosa sobre camisa blanca',
   'Pelo rubio rizado por encima del hombro',
   ARRAY['pendientes discretos'],
   ARRAY['secador rose gold','cepillo redondo','tijeras'],
   '#EC4899',
   'a warm middle-aged woman, curly shoulder-length blonde hair, wearing a pink sweater over a white shirt, gentle smile, holding hair styling tools',
   'Warm middle-aged woman with curly shoulder-length golden-blonde hair. Wearing a soft pink sweater over a crisp white collared shirt. Gentle caring smile with laugh lines around kind hazel eyes. Holding a rose-gold blow dryer naturally. Pixar-style maternal warmth with slightly rosy cheeks.',
   '{"age_range":"45-53","body_type":"average","facial_features":"kind hazel eyes, laugh lines, rosy cheeks","hair":"curly golden-blonde, shoulder-length","clothing":"pink sweater, white shirt","accessories":["small earrings"],"expression":"gentle, caring smile","pose":"welcoming stance"}',
   '{"always":"Siempre con su jersey rosa. Siempre sonriendo o con expresión cálida.","never":"Nunca con guantes. Nunca con expresión fría."}',
   2),
  -- NEREA
  (v_char_nerea, v_project_id,
   'Nerea', 'NE', 'Especialista en prótesis capilares',
   'Joven especialista en prótesis capilares. Meticulosa y empática. Su trabajo transforma vidas devolviendo la confianza a los clientes.',
   'Mujer joven concentrada, pelo oscuro recogido en moño bajo, chaquetón color crema, guantes de nitrilo en escenas de prótesis.',
   'Concentrada, empática, meticulosa, profesional',
   'Chaquetón color crema',
   'Pelo oscuro recogido en moño bajo',
   ARRAY['guantes de nitrilo'],
   ARRAY['adhesivo capilar','pinzas de precisión','peine de cola'],
   '#8B5CF6',
   'a focused young woman, dark hair in a low bun, wearing a cream-colored jacket, latex gloves, precise movements, working with hair prosthetics',
   'Focused young woman in her late twenties with dark brown hair pulled back in a neat low bun. Wearing a cream-colored professional jacket. Delicate hands with nitrile gloves in prosthetic scenes. Deep brown eyes showing concentration and empathy. Pixar-style with slightly larger expressive eyes conveying her caring nature.',
   '{"age_range":"26-32","body_type":"slim","facial_features":"deep brown eyes, focused expression, delicate features","hair":"dark brown, low bun","clothing":"cream jacket","accessories":["nitrile gloves in prosthetic scenes"],"expression":"focused, empathetic","pose":"precise working stance"}',
   '{"always":"Guantes de nitrilo en toda escena de prótesis. Pelo siempre recogido en moño.","never":"Nunca con el pelo suelto. Nunca con expresión distraída."}',
   3),
  -- RAÚL
  (v_char_raul, v_project_id,
   'Raúl', 'RA', 'Barbero',
   'Barbero joven y moderno. Estilo urbano con tatuajes visibles. Especialista en degradados y barbería contemporánea.',
   'Hombre joven en forma, barba cuidada, tatuajes visibles en los brazos, camiseta negra ajustada, maquinilla de barbero.',
   'Seguro, moderno, enérgico, creativo',
   'Camiseta negra ajustada',
   'Barba cuidada, pelo corto estilizado',
   ARRAY['tatuajes visibles en brazos'],
   ARRAY['maquinilla de barbero','navaja','peine de barbero'],
   '#10B981',
   'a fit young man with a well-groomed beard, visible tattoos on arms, wearing a fitted black t-shirt, confidently holding barber clippers',
   'Athletic young man in his mid-twenties with a perfectly groomed short beard and styled short hair. Visible geometric and botanical tattoos covering both forearms. Wearing a fitted black crew-neck t-shirt showing muscular arms. Confident stance holding professional barber clippers. Pixar-style with strong jaw and energetic green eyes.',
   '{"age_range":"24-30","body_type":"athletic","facial_features":"groomed beard, strong jaw, green eyes","hair":"short styled","clothing":"fitted black t-shirt","accessories":["forearm tattoos"],"expression":"confident, energetic","pose":"holding clippers"}',
   '{"always":"Tatuajes siempre visibles. Siempre con camiseta negra.","never":"Nunca con manga larga que tape los tatuajes. Nunca sin su barba."}',
   4)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 7. BACKGROUNDS (3)
  -- =============================================

  INSERT INTO public.backgrounds (
    id, project_id, code, name, description,
    location_type, time_of_day, prompt_snippet,
    ai_prompt_description,
    ai_visual_analysis,
    available_angles, sort_order
  ) VALUES
  (v_bg_ext, v_project_id,
   'BG-EXT', 'Fachada exterior del salón',
   'Fachada moderna de cristal del salón Domenech con letras doradas DOMENECH, entorno urbano.',
   'exterior', 'afternoon',
   'exterior facade of Domenech hair salon, modern glass storefront with golden DOMENECH lettering, warm afternoon light, urban street setting',
   'Modern glass-fronted hair salon exterior with large floor-to-ceiling windows. Golden metallic "DOMENECH" lettering above entrance. Warm afternoon golden-hour sunlight casting long shadows. Clean urban street with subtle pedestrian activity. Potted olive trees flanking the entrance. Warm interior glow visible through glass.',
   '{"lighting":"golden hour afternoon","materials":"glass, metal, stone","colors":["#C8A96E","#2A1A0A","#87CEEB"],"atmosphere":"premium, inviting","depth":"street to interior","objects":["entrance door","lettering","potted trees","street lamps"]}',
   ARRAY['frontal','lateral','angular','POV entrada','aerial'],
   1),
  (v_bg_pelucas, v_project_id,
   'BG-PROT', 'Sala de prótesis capilares',
   'Sala íntima de consulta de prótesis capilares con iluminación suave y cálida, cabezas de maniquí con pelucas, espejos.',
   'interior', 'day',
   'interior of a specialized hair prosthetics consultation room, soft warm lighting, mannequin heads with wigs, mirrors, intimate private space',
   'Intimate private consultation room with soft diffused warm lighting from recessed ceiling spots. Wooden counter with 4-5 mannequin heads displaying different hair prosthetics. Large illuminated mirror on wall. Cream-colored walls, plush client chair. Warm mahogany accents. Clean and clinical yet comforting atmosphere.',
   '{"lighting":"soft diffused warm spots","materials":"wood, fabric, glass","colors":["#F5EDD8","#8B7355","#FFFFFF"],"atmosphere":"intimate, comforting, clinical","depth":"shallow room","objects":["mannequin heads","mirror","client chair","prosthetic tools"]}',
   ARRAY['frontal','lateral','detail table','POV client','mirror reflection'],
   2),
  (v_bg_estilismo, v_project_id,
   'BG-MAIN', 'Sala principal de estilismo',
   'Zona principal del salón con múltiples estaciones de estilismo, espejos, iluminación ámbar cálida, diseño moderno.',
   'interior', 'day',
   'interior of the main styling area of Domenech salon, multiple styling stations with mirrors, warm amber lighting, modern design, hair tools visible',
   'Spacious main styling floor with 6 fully-equipped stations along both walls. Large illuminated mirrors at each station with warm LED strips. Polished concrete floor with warm amber overhead lighting. Modern minimalist design with golden accents matching brand palette. Hair tools, products, and blow dryers visible at stations. Central aisle with warm light streaming from skylights.',
   '{"lighting":"warm amber overhead + LED mirror strips","materials":"concrete, glass, metal, leather","colors":["#C8A96E","#333333","#E8E0D0"],"atmosphere":"energetic, professional, modern","depth":"long room with stations","objects":["styling chairs","mirrors","tools","products","blow dryers"]}',
   ARRAY['panoramic','individual station','mirror','overhead','tracking through'],
   3)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 8. VIDEO (1 primary — 90 seconds YouTube)
  -- =============================================
  INSERT INTO public.videos (
    id, short_id, project_id,
    title, slug, description,
    video_type, platform, aspect_ratio, target_duration_seconds,
    status, is_primary,
    style_preset_id,
    narration_voice_id, narration_voice_name, narration_provider,
    narration_speed, narration_style,
    sort_order
  ) VALUES (
    v_video_id, v_video_sid, v_project_id,
    'Presentación Domenech — YouTube 90s',
    'presentacion-youtube-90s',
    'Vídeo promocional principal de 90 segundos para YouTube. Presenta al equipo, servicios y especialidad en prótesis capilares. Arco narrativo: gancho → presentación → servicios → especialidad (prótesis) → transformación → CTA.',
    'long',
    'youtube',
    '16:9',
    90,
    'prompting',
    TRUE,
    v_style_id,
    'pNInz6obpgDQGcFmaJgB',
    'Antonio (ElevenLabs Español)',
    'elevenlabs',
    1.0,
    'warm_professional',
    1
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 9. SCENES (16 scenes = 90 seconds)
  -- =============================================

  INSERT INTO public.scenes (
    id, video_id, project_id,
    title, description, dialogue, client_annotation, annotation_source,
    scene_number, sort_order, duration_seconds, arc_phase,
    status, scene_type, generation_context, is_filler,
    notes, director_notes, metadata
  ) VALUES
  -- SC1: Cold open scissors (0:00-0:05, 5s)
  (v_sc_n1, v_video_id, v_project_id,
   'Cold open: tijeras ASMR',
   'Pantalla en negro. Se escucha un sonido amplificado de tijeras. Plano extremo de tijeras profesionales cromadas abriéndose y cerrándose en cámara lenta. Un solo mechón dorado siendo cortado cae en slow motion. Fondo negro con iluminación lateral dramática que refleja en el metal.',
   NULL,
   'Quiero que el vídeo empiece con algo que enganche, algo visual e hipnótico, tipo ASMR. Que las tijeras brillen.',
   'client',
   1, 1, 5.0, 'hook',
   'prompt_ready', 'original',
   'Escena creada a partir de la anotación del cliente: quiere un gancho ASMR visual con tijeras.',
   FALSE,
   'Sin música, solo sonido amplificado de tijeras. Añadir reverb sutil.',
   'ASMR visual puro. El sonido de las tijeras debe ser satisfactorio. La cámara no se mueve, el mechón cae en slow-mo perfecto. El brillo en el metal de las tijeras es clave.',
   '{"sound_design":"amplified scissors + subtle reverb","music":"none first 3s, then soft piano fade-in"}'),

  -- SC2: Logo reveal (0:05-0:10, 5s)
  (v_sc_e1, v_video_id, v_project_id,
   'Logo reveal: DOMENECH dorado',
   'El mechón dorado de la escena anterior se transforma en partículas doradas que se reorganizan formando las letras D-O-M-E-N-E-C-H. Las letras se materializan una a una con un brillo cálido. Al completarse, un destello sutil recorre la palabra. Fondo negro con luz volumétrica dorada.',
   NULL,
   'Que el logo aparezca de forma elegante, como si el pelo se convirtiera en el nombre. Muy premium.',
   'client',
   2, 2, 5.0, 'hook',
   'prompt_ready', 'improved',
   'Escena vinculada a la anterior: el mechón cortado se transforma en el logo.',
   FALSE,
   'Transición directa desde escena anterior. Crescendo musical suave.',
   'Push-in sutil de cámara mientras se forman las letras. El destello final debe ser elegante, no exagerado. Tipografía serif premium.',
   NULL),

  -- SC3: Exterior dolly-in (0:10-0:16, 6s)
  (v_sc_e2, v_video_id, v_project_id,
   'Fachada exterior — dolly-in',
   'Cámara comienza a nivel del suelo y avanza hacia la fachada de cristal del salón. Las letras doradas DOMENECH brillan sobre el cristal. Luz de atardecer cálida, reflejos en el vidrio. Transeúntes caminando de fondo dan vida a la escena. Se intuye el interior iluminado del salón.',
   NULL,
   'Que se vea bien la fachada del salón, que parezca un sitio premium donde quieres entrar.',
   'client',
   3, 3, 6.0, 'build',
   'prompt_ready', 'improved',
   'Establece la ubicación. El dolly-in invita al espectador a entrar.',
   FALSE,
   NULL,
   'Dolly-in cinematográfico desde nivel del suelo. Los reflejos en el cristal son cruciales para el look premium. Los transeúntes deben estar desenfocados en segundo plano.',
   NULL),

  -- SC4: Team portrait (0:16-0:24, 8s → base 6s + ext 6s)
  (v_sc_e3, v_video_id, v_project_id,
   'Retrato del equipo completo',
   'Los cuatro miembros del equipo de pie juntos en la sala principal con sus herramientas características. José en el centro con blazer azul liderando. Conchi a su izquierda con secador y cepillo. Nerea a su derecha con equipo de prótesis. Raúl en el extremo con maquinilla. Composición de retrato de equipo cinematográfico. Partículas doradas sutiles en el ambiente.',
   NULL,
   'Quiero que se vea al equipo junto, que transmitan profesionalidad y que cada uno se identifique con su herramienta.',
   'client',
   4, 4, 8.0, 'build',
   'prompt_ready', 'improved',
   'Escena clave de presentación. Necesita extensión para dar tiempo a ver a cada personaje.',
   FALSE,
   'Música sube ligeramente. Cada personaje tiene un micro-momento de protagonismo.',
   'José siempre en el centro como líder. Cada personaje debe mostrar SU herramienta. Poses confiadas pero naturales, no posadas. La extensión permite una panorámica lenta por el equipo.',
   NULL),

  -- SC5: Styling montage (0:24-0:30, 6s)
  (v_sc_e6, v_video_id, v_project_id,
   'Estilismo en acción — montaje',
   'Montaje rápido de servicios de estilismo: José cortando con tijeras en una estación, Conchi secando pelo en otra. Cortes rápidos entre ambas estaciones mostrando la energía y dinamismo del salón en plena actividad.',
   NULL,
   'Que se vea el salón funcionando, con ritmo, como si entraras y todo fluyera.',
   'client',
   5, 5, 6.0, 'build',
   'prompt_ready', 'original',
   'Montaje dinámico que muestra la energía del salón.',
   FALSE,
   'Música enérgica. Cortes rápidos sincronizados al ritmo.',
   'Montaje dinámico con tracking lateral a través del salón. Mostrar herramientas en acción: tijeras cortando, secador soplando, pelo cayendo.',
   NULL),

  -- SC6: Raúl barbershop (0:30-0:36, 6s)
  (v_sc_e7, v_video_id, v_project_id,
   'Raúl: degradado perfecto',
   'Primer plano de Raúl realizando un degradado perfecto con maquinilla. Concentración absoluta en su rostro. Los tatuajes de sus brazos visibles mientras trabaja. Pelo cayendo con cada pasada. El zumbido de la maquinilla es casi hipnótico.',
   NULL,
   'Que Raúl se vea como un artista con su maquinilla. Que se note la precisión.',
   'client',
   6, 6, 6.0, 'build',
   'prompt_ready', 'original',
   'Raúl como artista de la barbería. Plano cerrado mostrando precisión.',
   FALSE,
   NULL,
   'Primer plano cerrado en las manos y la maquinilla. Los tatuajes DEBEN ser visibles. Cada pelo que cae importa.',
   NULL),

  -- SC7: Conchi coloring (0:36-0:41, 5s)
  (v_sc_e7b, v_video_id, v_project_id,
   'Conchi: coloración experta',
   'Conchi aplicando coloración con pincel y cuenco. Movimientos expertos y sonrisa cálida dirigida a su clienta. La clienta se refleja en el espejo, relajada y confiada.',
   NULL,
   NULL,
   'ai_suggested',
   7, 7, 5.0, 'build',
   'prompt_ready', 'original',
   'Escena generada por IA como continuación natural del montaje de servicios. Muestra la calidez de Conchi.',
   FALSE,
   NULL,
   'La cercanía de Conchi con la clienta es lo que define esta escena. La sonrisa debe ser genuina y cálida.',
   NULL),

  -- SC8: Nerea consultation (0:41-0:46, 5s)
  (v_sc_e7c, v_video_id, v_project_id,
   'Nerea: consulta de prótesis',
   'Nerea en su sala privada de consulta mostrando opciones de prótesis capilar a un cliente masculino. Cabezas de maniquí con diferentes piezas de fondo. Ambiente íntimo, iluminación suave. Nerea explica con empatía mientras el cliente toca una de las piezas.',
   NULL,
   NULL,
   'ai_suggested',
   8, 8, 5.0, 'build',
   'prompt_ready', 'original',
   'Transición natural hacia la sección de prótesis. Introduce el servicio estrella de forma sutil.',
   FALSE,
   NULL,
   'Momento íntimo. La sala de prótesis tiene su propia atmósfera: más cálida, más privada. Nerea guía con empatía.',
   NULL),

  -- SC9: Title card prótesis (0:46-0:49, 3s)
  (v_sc_r4, v_video_id, v_project_id,
   'Rótulo: Prótesis Capilares',
   'Rótulo elegante con texto "Prótesis Capilares" en tipografía dorada sobre fondo oscuro. Partículas doradas sutiles flotando. Transición suave desde la escena anterior.',
   NULL,
   NULL,
   'none',
   9, 9, 3.0, 'peak',
   'draft', 'filler',
   'Escena de relleno para marcar la transición a la sección de especialidad.',
   TRUE,
   NULL, NULL, NULL),

  -- SC10: Prosthetic glue close-up (0:49-0:57, 8s → base 6s + ext 6s)
  (v_sc_e4a, v_video_id, v_project_id,
   'Aplicación de adhesivo — extreme close-up',
   'Plano extremo de las manos de Nerea con guantes de nitrilo aplicando adhesivo transparente a una pieza de prótesis capilar. Cada gota de adhesivo es visible. Movimientos milimétricos, concentración total. La iluminación suave crea una atmósfera de cirugía artística. Profundidad de campo reducida: solo las manos y la pieza están enfocadas.',
   NULL,
   'Quiero que esta escena transmita la precisión quirúrgica de Nerea. Que se vea que esto es un arte, no algo simple.',
   'client',
   10, 10, 8.0, 'peak',
   'prompt_ready', 'improved',
   'Clímax técnico. La precisión del trabajo de Nerea es lo que diferencia a Domenech. Necesita extensión.',
   FALSE,
   NULL,
   'El momento MÁS técnico del vídeo. La cámara debe estar tan cerca que se vean las texturas del adhesivo y los hilos de la prótesis. La extensión muestra el resultado del adhesivo aplicado.',
   NULL),

  -- SC11: Prosthetic placement (0:57-1:05, 8s → base 6s + ext 6s)
  (v_sc_e4b, v_video_id, v_project_id,
   'Colocación de prótesis en cliente',
   'Plano medio de Nerea colocando la prótesis capilar sobre un cliente masculino de mediana edad. La expresión del cliente cambia gradualmente de ansiedad a esperanza mientras Nerea ajusta la pieza con delicadeza. El reflejo en el espejo muestra la transformación en progreso.',
   NULL,
   'Este es el momento estrella. Que se note la emoción del cliente, que la transformación sea visible y emocionante.',
   'client',
   11, 11, 8.0, 'peak',
   'prompt_ready', 'improved',
   'El momento de mayor carga emocional del vídeo. La transformación del cliente ES el mensaje de la marca.',
   FALSE,
   'Música emotiva, cuerdas suaves. Sin narración aquí, que la imagen hable.',
   'Capturar la transformación emocional. El espejo debe mostrar el antes/después sutil. Nerea trabaja con delicadeza. La extensión muestra el ajuste final.',
   NULL),

  -- SC12: Reveal (1:05-1:10, 5s)
  (v_sc_n7, v_video_id, v_project_id,
   'Reveal: el cliente se ve por primera vez',
   'El cliente se mira al espejo por primera vez con la prótesis puesta. Su expresión cambia de incertidumbre a emoción. Se lleva la mano a la cabeza, tocando el pelo nuevo con incredulidad. Una lágrima de felicidad. Nerea sonríe orgullosa detrás de él.',
   NULL,
   'El momento de las lágrimas. Que se le vea la emoción al cliente y que Nerea esté ahí orgullosa.',
   'client',
   12, 12, 5.0, 'peak',
   'prompt_ready', 'new',
   'El clímax emocional absoluto. Este es el frame que se comparte en redes.',
   FALSE,
   'Música alcanza su punto más emotivo. Posible silencio dramático antes de la reacción.',
   'El momento más emotivo del vídeo. La cámara DEBE capturar la reacción facial del cliente. La mano tocando el pelo nuevo es icónica. Nerea sonriendo de fondo completa la escena.',
   NULL),

  -- SC13: Team celebration (1:10-1:17, 7s → base 6s + ext 6s)
  (v_sc_e5, v_video_id, v_project_id,
   'Celebración del equipo',
   'Los cuatro profesionales celebrando juntos en la sala principal. José aplaudiendo con orgullo, Conchi riendo con alegría genuina, Nerea sonriendo satisfecha, Raúl levantando el pulgar. Partículas doradas tipo confeti flotando en la iluminación ámbar.',
   NULL,
   'Un momento de equipo, que se sientan como familia. Que transmita que aquí trabajan personas que aman lo que hacen.',
   'client',
   13, 13, 7.0, 'peak',
   'prompt_ready', 'improved',
   'Celebración del equipo. Transmite la unión familiar del negocio.',
   FALSE,
   'Música alegre, crescendo. Las partículas doradas aportan magia Pixar.',
   'Cada personaje reacciona de forma característica. Las partículas doradas tipo confeti son el toque Pixar mágico.',
   NULL),

  -- SC14: Final montage results (1:17-1:22, 5s)
  (v_sc_e8, v_video_id, v_project_id,
   'Montaje final: clientes satisfechos',
   'Secuencia rápida de 3-4 clientes diferentes mirándose al espejo, tocándose el pelo con felicidad. Sonrisas genuinas, miradas de sorpresa y satisfacción. Transformaciones completadas: una mujer con nuevo color, un hombre con prótesis, un joven con degradado.',
   NULL,
   NULL,
   'ai_suggested',
   14, 14, 5.0, 'close',
   'prompt_ready', 'original',
   'Montaje de resultados que refuerza el mensaje: cada cliente sale transformado.',
   FALSE,
   NULL,
   'Cortes rápidos sincronizados con la música. Cada cliente muestra una transformación diferente. Emociones genuinas.',
   NULL),

  -- SC15: Tagline (1:22-1:25, 3s)
  (v_sc_r3, v_video_id, v_project_id,
   'Tagline: Tu mejor versión empieza aquí',
   'Fondo oscuro elegante. El texto "Tu mejor versión empieza aquí" aparece letra a letra en tipografía dorada. Al completarse, un brillo sutil recorre el texto. La swash dorada de Domenech aparece debajo.',
   NULL,
   NULL,
   'none',
   15, 15, 3.0, 'close',
   'draft', 'filler',
   'Tagline de cierre. Reafirma el mensaje de marca.',
   TRUE,
   NULL, NULL, NULL),

  -- SC16: CTA exterior sunset (1:25-1:30, 5s)
  (v_sc_e9, v_video_id, v_project_id,
   'CTA: fachada al atardecer',
   'Plano final del exterior del salón Domenech al atardecer. Las letras DOMENECH brillan con la luz dorada. Aparece la información de contacto: teléfono, dirección, redes sociales. La cámara se aleja lentamente como invitando al espectador a venir.',
   NULL,
   'El cierre con la fachada al atardecer, que sea bonito y quede grabado el nombre y cómo llegar.',
   'client',
   16, 16, 5.0, 'close',
   'prompt_ready', 'original',
   'CTA final. El espectador debe recordar el nombre y saber dónde está.',
   FALSE,
   'Música se suaviza. Sonido ambiente de calle.',
   'Plano final estático y elegante. Dolly-out lento. El atardecer dorado refuerza la paleta de marca. Los datos de contacto deben ser legibles.',
   NULL)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 10. SCENE CAMERA (16)
  -- =============================================
  INSERT INTO public.scene_camera (scene_id, camera_angle, camera_movement, camera_notes, lighting, mood, ai_reasoning) VALUES
    (v_sc_n1, 'extreme_close_up', 'static', 'Cámara fija, todo el movimiento es del mechón cayendo en slow-mo.', 'Dramatic side lighting, black background, metallic reflections on scissors', 'Dramatic, ASMR, hypnotic', 'Plano extremo estático para maximizar el efecto ASMR. El movimiento viene del objeto, no de la cámara.'),
    (v_sc_e1, 'medium', 'dolly_in', 'Push-in sutil mientras se forman las letras DOMENECH.', 'Volumetric golden light, black background', 'Elegant, dramatic, premium', 'Dolly-in genera la sensación de descubrimiento del logo. Velocidad lenta y constante.'),
    (v_sc_e2, 'low_angle', 'dolly_in', 'Comienza a nivel del suelo, avanza hacia la fachada.', 'Golden hour afternoon sunlight, warm reflections on glass', 'Inviting, warm, cinematic', 'Ángulo bajo da grandeza al edificio. El dolly-in simula la perspectiva de alguien que se acerca a entrar.'),
    (v_sc_e3, 'medium', 'pan_left', 'Panorámica lenta de derecha a izquierda revelando a cada miembro.', 'Warm amber studio lighting with golden particles', 'Confident, professional, united', 'Pan lento para que el espectador tenga tiempo de identificar a cada profesional y su herramienta.'),
    (v_sc_e6, 'medium', 'tracking', 'Tracking lateral a través del salón, pasando por las estaciones.', 'Warm amber lighting, busy salon atmosphere', 'Energetic, dynamic, professional', 'Tracking lateral crea ritmo y dinamismo. Simula caminar por el salón.'),
    (v_sc_e7, 'close_up', 'static', 'Plano cerrado fijo en manos y maquinilla de Raúl.', 'Warm directional lighting, side highlight on tattoos', 'Focused, precise, skilled', 'Plano estático deja que la precisión de las manos sea la protagonista.'),
    (v_sc_e7b, 'medium', 'static', 'Plano medio mostrando interacción Conchi-clienta.', 'Warm amber lighting, soft fill light on faces', 'Caring, professional, warm', 'Estático para transmitir calma y confianza. La conexión entre personas.'),
    (v_sc_e7c, 'medium', 'static', 'Sala privada, Nerea mostrando opciones al cliente.', 'Soft warm diffused lighting, intimate', 'Intimate, empathetic, professional', 'Estático y medio para mostrar tanto a Nerea como al cliente y las prótesis.'),
    (v_sc_r4, 'medium', 'static', 'Rótulo estático centrado.', 'Golden volumetric light, dark background', 'Elegant, transitional', NULL),
    (v_sc_e4a, 'extreme_close_up', 'dolly_in', 'Dolly-in ultra lento hacia las manos, enfocando cada detalle.', 'Soft warm overhead spotlight, shallow depth of field', 'Intimate, precise, surgical', 'Extreme close-up + dolly-in lento crea tensión y admiración por la precisión del trabajo.'),
    (v_sc_e4b, 'medium', 'static', 'Plano medio incluyendo cliente, Nerea y reflejo en espejo.', 'Warm soft intimate lighting', 'Emotional, transformative, hopeful', 'Medio estático para capturar la transformación emocional del cliente sin distracciones.'),
    (v_sc_n7, 'close_up', 'dolly_in', 'Close-up del rostro del cliente, dolly-in lento hacia su reacción.', 'Warm soft intimate lighting, slight backlight glow', 'Deeply emotional, transformative, tearful joy', 'El dolly-in al rostro intensifica la conexión emocional. El espectador siente lo que el cliente siente.'),
    (v_sc_e5, 'medium', 'static', 'Plano medio del equipo completo celebrando.', 'Warm golden lighting with floating gold particles', 'Joyful, celebratory, triumphant', 'Medio estático para ver a los 4 juntos. Las partículas doradas dan el toque mágico Pixar.'),
    (v_sc_e8, 'medium', 'tracking', 'Tracking rápido entre diferentes clientes satisfechos.', 'Warm golden lighting, multiple stations', 'Satisfied, happy, transformed', 'Tracking con cortes rápidos crea ritmo de montaje final. Energía acumulada.'),
    (v_sc_r3, 'medium', 'static', 'Rótulo centrado, texto apareciendo.', 'Warm golden glow, dark elegant background', 'Elegant, closing, memorable', NULL),
    (v_sc_e9, 'medium', 'dolly_out', 'Dolly-out lento alejándose de la fachada.', 'Golden hour sunset, warm cinematic lighting', 'Inviting, warm, memorable, closing', 'Dolly-out como despedida. El espectador se aleja pero recuerda el nombre y la ubicación.')
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 11. SCENE VIDEO CLIPS (base + extensions)
  -- =============================================
  INSERT INTO public.scene_video_clips (
    id, scene_id, clip_type, extension_number, parent_clip_id,
    duration_seconds,
    visual_description_es,
    prompt_video, prompt_image_first_frame,
    generator, status, version, is_current,
    ai_extension_reasoning
  ) VALUES
  -- SC1: Cold open (5s → 1 clip 6s)
  (v_clip_n1, v_sc_n1, 'base', 0, NULL,
   6.0,
   'Tijeras profesionales cromadas se abren y cierran en cámara super lenta contra fondo negro. Un mechón dorado es cortado y cae flotando. La luz lateral dramática crea reflejos hipnóticos en el metal.',
   'Pixar Studios 3D animated video, extreme close-up of professional chrome hairdressing scissors opening and closing in ultra slow motion, single golden hair strand being cut and floating down, pure black background, dramatic side lighting creating hypnotic metallic reflections, ASMR visual feel, cinematic shallow depth of field, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, extreme close-up of professional chrome scissors slightly open with a single golden hair strand between blades, pure black background, dramatic side lighting, metallic reflections, cinematic, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC2: Logo reveal (5s → 1 clip 6s)
  (v_clip_e1, v_sc_e1, 'base', 0, NULL,
   6.0,
   'Partículas doradas se reorganizan mágicamente formando las letras DOMENECH una a una. Cada letra se materializa con un brillo cálido. Al completarse, un destello elegante recorre la palabra.',
   'Pixar Studios 3D animated video, golden particles magically reorganizing to form the word DOMENECH letter by letter, each letter materializing with warm golden glow, subtle sparkle traveling across completed word, black background with volumetric golden light, premium luxury feel, smooth camera push-in, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, scattered golden particles beginning to coalesce on black background, first letter D partially formed in golden light, volumetric warm light, cinematic, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC3: Exterior (6s → 1 clip 6s)
  (v_clip_e2, v_sc_e2, 'base', 0, NULL,
   6.0,
   'La cámara avanza desde el nivel del suelo hacia la fachada de cristal del salón Domenech. Las letras doradas brillan. Luz de atardecer, reflejos en el vidrio, transeúntes desenfocados de fondo.',
   'Pixar Studios 3D animated video, cinematic dolly-in from ground level towards Domenech hair salon glass facade, golden DOMENECH lettering glowing above entrance, warm golden-hour afternoon light, glass reflections, blurred pedestrians walking past, potted olive trees flanking door, interior warm glow visible, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, street-level view looking up at modern glass-fronted Domenech salon, golden lettering above, warm afternoon golden-hour light, urban setting, cinematic low-angle, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC4: Team portrait (8s → base 6s + extension 6s)
  (v_clip_e3_base, v_sc_e3, 'base', 0, NULL,
   6.0,
   'Los cuatro miembros del equipo de pie en la sala principal. La cámara recorre de derecha a izquierda revelando primero a Raúl con su maquinilla, luego a Nerea con sus pinzas, después a José en el centro con sus tijeras levantadas.',
   'Pixar Studios 3D animated video, slow pan revealing four team members standing in salon, starting with Raúl holding clippers with confident smirk and visible tattoos, revealing Nerea with precision tools and low bun, then José center-frame in blue blazer holding gold scissors up proudly, warm amber lighting, golden particles floating, professional team portrait, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, right side of Domenech salon interior, Raúl standing confidently holding barber clippers, tattoos visible on arms, warm amber lighting, golden particles in air, cinematic, 4K',
   'grok', 'pending', 1, TRUE,
   'La escena necesita 8 segundos para revelar a los 4 miembros. Con 6s de base revelamos a Raúl, Nerea y José. La extensión completa con Conchi y un moment de equipo unido.'),
  (v_clip_e3_ext1, v_sc_e3, 'extension', 1, v_clip_e3_base,
   6.0,
   'Continuando la panorámica, se revela a Conchi con su secador rose-gold y sonrisa cálida. La cámara se detiene mostrando al equipo completo. Un momento de orgullo colectivo. José levanta ligeramente la barbilla.',
   '[extensión 1] Continuing from last frame, pan reveals Conchi holding rose-gold blow dryer with warm maternal smile, camera settles showing all four team members in final team portrait composition, collective pride moment, José lifts chin slightly, golden particles settle, warm amber lighting, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC5: Styling montage (6s → 1 clip)
  (v_clip_e6, v_sc_e6, 'base', 0, NULL,
   6.0,
   'Montaje dinámico del salón en plena actividad. José cortando con tijeras en una estación. Conchi secando pelo en otra. Raúl con maquinilla. Tracking lateral fluidO a través del salón mostrando la energía.',
   'Pixar Studios 3D animated video, dynamic tracking shot through busy Domenech salon, José cutting hair with scissors at one station, Conchi blow-drying at next station, Raúl using clippers further down, lateral tracking camera movement, warm amber lighting, hair tools in motion, energetic professional atmosphere, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, interior of busy Domenech salon from side angle, José at styling station cutting hair with professional scissors, warm amber lighting, multiple stations visible, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC6: Raúl barbershop (6s → 1 clip)
  (v_clip_e7, v_sc_e7, 'base', 0, NULL,
   6.0,
   'Primer plano de las manos de Raúl con maquinilla realizando un degradado. Los tatuajes de sus brazos se mueven con cada pasada. Pelo cayendo. Concentración total.',
   'Pixar Studios 3D animated video, close-up of Raúl performing perfect fade haircut, clippers buzzing precisely, tattooed forearms visible, fine hair falling with each pass, concentrated expression, warm directional side lighting highlighting tattoo details, barbershop precision, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, close-up of tattooed male hands holding professional barber clippers against client head mid-fade, warm directional lighting, barbershop setting, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC7: Conchi coloring (5s → 1 clip 6s)
  (v_clip_e7b, v_sc_e7b, 'base', 0, NULL,
   6.0,
   'Conchi aplica coloración con pincel y cuenco. Movimientos expertos y sonrisa cálida hacia su clienta que se relaja en el sillón.',
   'Pixar Studios 3D animated video, medium shot of warm middle-aged blonde woman applying hair color with brush and bowl, expert confident strokes, warm caring smile to relaxed female client in chair, mirror reflection visible, styling station, warm amber lighting, maternal caring atmosphere, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, warm middle-aged blonde woman in pink sweater carefully applying hair dye with brush, female client in salon chair, warm amber lighting, styling station with mirror, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC8: Nerea consultation (5s → 1 clip 6s)
  (v_clip_e7c, v_sc_e7c, 'base', 0, NULL,
   6.0,
   'Nerea en sala privada mostrando opciones de prótesis a un cliente. Cabezas de maniquí de fondo. El cliente toca una pieza con curiosidad mientras Nerea explica con empatía.',
   'Pixar Studios 3D animated video, young woman with dark hair low bun in cream jacket showing hair prosthetic options to middle-aged male client in private consultation room, mannequin heads with different hairpieces in background, client reaching to touch a piece with curiosity, soft warm diffused lighting, intimate empathetic setting, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, intimate prosthetics consultation room, young woman in cream jacket presenting hair pieces to seated male client, mannequin heads on wooden counter, soft warm lighting, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC9: Title card prótesis (3s → 1 clip 6s trimmed)
  (v_clip_r4, v_sc_r4, 'base', 0, NULL,
   6.0,
   'Rótulo elegante: "Prótesis Capilares" en tipografía dorada. Partículas doradas flotando suavemente. Fondo oscuro premium.',
   'Pixar Studios 3D animated video, elegant title card, golden calligraphy text "Prótesis Capilares" materializing on dark background, subtle floating gold particles, warm volumetric light from above, premium luxury typography reveal, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC10: Prosthetic glue (8s → base 6s + ext 6s)
  (v_clip_e4a_base, v_sc_e4a, 'base', 0, NULL,
   6.0,
   'Extreme close-up de las manos de Nerea con guantes de nitrilo aplicando adhesivo transparente a una pieza de prótesis. Cada gota de adhesivo es visible. Movimientos milimétricos. Iluminación cenital suave.',
   'Pixar Studios 3D animated video, extreme close-up of young woman hands in nitrile gloves carefully applying transparent adhesive to hair prosthetic piece, every droplet visible, millimetric precise movements, surgical precision, soft warm overhead spotlight, shallow depth of field, intimate artisan moment, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, extreme close-up of gloved hands holding hair prosthetic piece with precision tweezers, transparent adhesive visible, soft warm overhead light, shallow depth of field, dark background, 4K',
   'grok', 'pending', 1, TRUE,
   'La escena necesita 8s para mostrar el proceso completo de aplicación del adhesivo. Base 6s muestra la aplicación. Extensión muestra el resultado.'),
  (v_clip_e4a_ext1, v_sc_e4a, 'extension', 1, v_clip_e4a_base,
   6.0,
   'Continuando desde el último frame, las manos de Nerea alisan los bordes de la prótesis con pinzas de precisión. Se ve el resultado del adhesivo perfectamente aplicado. La pieza está lista para colocar.',
   '[extensión 1] Continuing from last frame, gloved hands smoothing prosthetic edges with precision tweezers, adhesive perfectly applied, piece ready for placement, subtle camera pull-back revealing the complete prepared prosthetic, soft warm lighting, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC11: Prosthetic placement (8s → base 6s + ext 6s)
  (v_clip_e4b_base, v_sc_e4b, 'base', 0, NULL,
   6.0,
   'Nerea coloca la prótesis capilar sobre la cabeza del cliente con extrema delicadeza. La expresión del cliente comienza a cambiar: de ansiedad a asombro. La pieza se integra gradualmente.',
   'Pixar Studios 3D animated video, medium shot of focused young woman in cream jacket carefully placing hair prosthetic on middle-aged male client head, client expression changing from anxiety to wonder, prosthetic gradually integrating, warm soft intimate lighting, mirror reflection showing transformation in progress, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, young woman in cream jacket leaning forward placing hair prosthetic on seated male client, client face showing nervous anticipation, soft warm intimate lighting, prosthetics room, 4K',
   'grok', 'pending', 1, TRUE,
   'Escena necesita 8s para la transformación completa. Base muestra la colocación. Extensión muestra el ajuste final y la reacción de esperanza.'),
  (v_clip_e4b_ext1, v_sc_e4b, 'extension', 1, v_clip_e4b_base,
   6.0,
   'Continuando: Nerea hace los ajustes finales, alisando los bordes de la prótesis. La expresión del cliente cambia a esperanza e incredulidad. Se ve en el espejo cómo la transformación se completa.',
   '[extensión 1] Continuing from last frame, final adjustments smoothing prosthetic edges, client expression shifting to hope and disbelief, mirror reflection showing near-complete transformation, Nerea gentle satisfied expression, warm emotional lighting, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC12: Reveal (5s → 1 clip 6s)
  (v_clip_n7, v_sc_n7, 'base', 0, NULL,
   6.0,
   'El cliente se mira al espejo por primera vez. Incredulidad. Se toca la cabeza. Lágrima de felicidad. Nerea sonríe orgullosa detrás.',
   'Pixar Studios 3D animated video, emotional reveal moment, middle-aged male client seeing himself for first time with hair prosthetic in mirror, hand slowly reaching up to touch new hair with disbelief, single tear of joy rolling down cheek, young woman in cream jacket smiling proudly behind him, warm soft intimate backlighting creating slight halo effect, deeply emotional cinematic moment, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, close-up of middle-aged man face looking at mirror with wide eyes and trembling smile, hand reaching toward head, tear forming, warm backlight glow, intimate emotional moment, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC13: Team celebration (7s → base 6s + ext 6s)
  (v_clip_e5_base, v_sc_e5, 'base', 0, NULL,
   6.0,
   'Los cuatro profesionales celebran juntos. José aplaude con orgullo, Conchi ríe, Nerea sonríe satisfecha, Raúl levanta el pulgar. Partículas doradas flotan como confeti mágico.',
   'Pixar Studios 3D animated video, four team members celebrating together in salon, heavyset man in blue blazer clapping proudly, blonde woman laughing with joy, young dark-haired woman smiling with satisfaction, tattooed young man giving thumbs up, floating golden confetti-like particles in warm amber lighting, joyful triumphant atmosphere, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, four stylized Pixar characters standing together celebrating in salon, golden confetti particles floating, warm amber lighting, joyful expressions, 4K',
   'grok', 'pending', 1, TRUE,
   'Escena de celebración necesita 7s. La extensión añade un momento de abrazo grupal.'),
  (v_clip_e5_ext1, v_sc_e5, 'extension', 1, v_clip_e5_base,
   6.0,
   'Continuando: el equipo se acerca para un abrazo grupal espontáneo. Risas y camaradería. Las partículas doradas se intensifican. Momento familiar genuino.',
   '[extensión 1] Continuing from last frame, team moves in for spontaneous group hug, laughter and camaraderie, golden particles intensifying, genuine family moment, warm amber lighting crescendo, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC14: Final montage (5s → 1 clip 6s)
  (v_clip_e8, v_sc_e8, 'base', 0, NULL,
   6.0,
   'Montaje rápido de clientes satisfechos mirándose al espejo. Sonrisas, manos tocando pelo nuevo, miradas de felicidad. Múltiples transformaciones completadas.',
   'Pixar Studios 3D animated video, quick montage of multiple satisfied clients looking at themselves in salon mirrors, touching their hair with happiness, diverse transformations: woman with new color, man with prosthetic, young man with fresh fade, warm golden lighting, joyful genuine expressions, tracking camera through stations, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, happy woman looking at herself in salon mirror touching her newly colored hair, warm golden lighting, satisfied smile, Domenech salon setting, 4K',
   'grok', 'pending', 1, TRUE, NULL),

  -- SC15: Tagline (3s → 1 clip 6s trimmed)
  (v_clip_r3, v_sc_r3, 'base', 0, NULL,
   6.0,
   'Fondo oscuro elegante. Texto dorado "Tu mejor versión empieza aquí" aparece letra a letra. Brillo recorre el texto completado. Logo swash de Domenech debajo.',
   'Pixar Studios 3D animated video, elegant dark background, golden text "Tu mejor versión empieza aquí" appearing letter by letter in premium serif typography, warm golden glow on each letter, subtle sparkle traveling across completed text, Domenech golden swash logo appearing below, cinematic premium closing, no dialogue, 4K 24fps',
   NULL,
   'grok', 'pending', 1, TRUE, NULL),

  -- SC16: CTA exterior sunset (5s → 1 clip 6s)
  (v_clip_e9, v_sc_e9, 'base', 0, NULL,
   6.0,
   'Exterior del salón al atardecer. Las letras DOMENECH brillan doradas. La cámara se aleja lentamente. Datos de contacto aparecen.',
   'Pixar Studios 3D animated video, exterior of Domenech salon at golden hour sunset, DOMENECH lettering glowing warm gold on facade, slow dolly-out camera movement, warm cinematic golden-hour lighting, gentle invitation to visit, contact info subtly appearing, peaceful urban evening, no dialogue, 4K 24fps',
   'Pixar Studios 3D animated render, exterior of Domenech salon at sunset, golden DOMENECH lettering glowing on modern glass facade, warm golden-hour light, potted olive trees, urban evening setting, cinematic, 4K',
   'grok', 'pending', 1, TRUE, NULL)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 12. SCENE CHARACTERS (N:N)
  -- =============================================
  INSERT INTO public.scene_characters (scene_id, character_id, role_in_scene, sort_order) VALUES
    (v_sc_e3, v_char_jose,   'protagonist', 1),
    (v_sc_e3, v_char_conchi,  'protagonist', 2),
    (v_sc_e3, v_char_nerea,   'protagonist', 3),
    (v_sc_e3, v_char_raul,    'protagonist', 4),
    (v_sc_e6, v_char_jose,   'protagonist', 1),
    (v_sc_e6, v_char_conchi,  'protagonist', 2),
    (v_sc_e6, v_char_raul,    'secondary', 3),
    (v_sc_e7, v_char_raul,    'protagonist', 1),
    (v_sc_e7b, v_char_conchi, 'protagonist', 1),
    (v_sc_e7c, v_char_nerea,  'protagonist', 1),
    (v_sc_e4a, v_char_nerea,  'protagonist', 1),
    (v_sc_e4b, v_char_nerea,  'protagonist', 1),
    (v_sc_n7, v_char_nerea,   'secondary', 1),
    (v_sc_e5, v_char_jose,   'protagonist', 1),
    (v_sc_e5, v_char_conchi,  'protagonist', 2),
    (v_sc_e5, v_char_nerea,   'protagonist', 3),
    (v_sc_e5, v_char_raul,    'protagonist', 4),
    (v_sc_e8, v_char_jose,   'secondary', 1)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 13. SCENE BACKGROUNDS (N:N)
  -- =============================================
  INSERT INTO public.scene_backgrounds (scene_id, background_id, is_primary, angle, time_of_day) VALUES
    (v_sc_e2, v_bg_ext,       TRUE, 'frontal low-angle', 'afternoon'),
    (v_sc_e3, v_bg_estilismo, TRUE, 'panoramic', 'day'),
    (v_sc_e6, v_bg_estilismo, TRUE, 'tracking lateral', 'day'),
    (v_sc_e7, v_bg_estilismo, TRUE, 'individual station', 'day'),
    (v_sc_e7b, v_bg_estilismo, TRUE, 'individual station', 'day'),
    (v_sc_e7c, v_bg_pelucas,  TRUE, 'frontal', 'day'),
    (v_sc_r4, v_bg_pelucas,   TRUE, 'detail', 'day'),
    (v_sc_e4a, v_bg_pelucas,  TRUE, 'detail table', 'day'),
    (v_sc_e4b, v_bg_pelucas,  TRUE, 'mirror reflection', 'day'),
    (v_sc_n7, v_bg_pelucas,   TRUE, 'mirror reflection', 'day'),
    (v_sc_e5, v_bg_estilismo, TRUE, 'panoramic', 'day'),
    (v_sc_e8, v_bg_estilismo, TRUE, 'tracking through', 'day'),
    (v_sc_e9, v_bg_ext,       TRUE, 'frontal', 'sunset')
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 14. VIDEO NARRATION (complete video)
  -- =============================================
  INSERT INTO public.video_narrations (
    id, video_id, version, narration_text, source,
    voice_id, voice_name, provider, speed, style,
    status, is_current
  ) VALUES (
    v_narration_id, v_video_id, 1,
    'En Domenech Peluquerías, cada tijera cuenta una historia.

Bienvenidos a nuestro salón, donde cuatro profesionales apasionados transforman vidas cada día.

José, nuestro director, lidera con la confianza de quien lleva la peluquería en las venas. Conchi, con su calidez y experiencia, hace que cada clienta se sienta en casa. Raúl domina el arte de la barbería moderna con la precisión de un artista. Y Nerea... Nerea hace magia.

Especialistas en prótesis capilares, en Domenech devolvemos lo que el tiempo se llevó. Cada pieza es una obra de artesanía, colocada con la precisión de un cirujano y la delicadeza de quien entiende lo que significa recuperar la confianza.

El momento en que un cliente se mira al espejo y se reconoce de nuevo... ese es el momento por el que trabajamos.

Tu mejor versión empieza aquí. Domenech Peluquerías.',
    'ai',
    'pNInz6obpgDQGcFmaJgB',
    'Antonio (ElevenLabs Español)',
    'elevenlabs',
    1.0,
    'warm_professional',
    'draft',
    TRUE
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 15. VIDEO ANALYSIS
  -- =============================================
  INSERT INTO public.video_analysis (
    id, video_id, version,
    strengths, weaknesses, suggestions,
    overall_score, summary,
    analysis_model, status, is_current
  ) VALUES (
    v_analysis_id, v_video_id, 1,
    '[
      {"title":"Arco emocional potente","detail":"La progresión de servicios generales a prótesis capilares crea un crescendo emocional que culmina en el reveal del cliente. Estructura narrativa profesional.","affected_scenes":[10,11,12]},
      {"title":"Gancho ASMR efectivo","detail":"El cold open con tijeras en slow-mo y sonido amplificado capta la atención en los primeros 2 segundos. Muy adecuado para YouTube.","affected_scenes":[1]},
      {"title":"Prompts técnicamente sólidos","detail":"Los prompts mantienen consistencia Pixar 3D, incluyen directivas de cámara, iluminación y terminan con NO DIALOGUE. Bien estructurados para generación.","affected_scenes":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]},
      {"title":"Extensiones bien planificadas","detail":"Las escenas clave (equipo, prótesis) usan extensiones de 6s que permiten desarrollar la acción sin cortes artificiales.","affected_scenes":[4,10,11,13]}
    ]',
    '[
      {"title":"Transición brusca servicios → prótesis","detail":"El salto de la consulta de Nerea (escena 8) al rótulo de prótesis (escena 9) es algo abrupto. Falta una transición visual suave.","severity":"medium","affected_scenes":[8,9]},
      {"title":"Poca variedad de ángulos de cámara","detail":"Las escenas 7, 8, 11 y 13 usan medium + static. Más variedad cenital, POV u over-shoulder mejoraría el dinamismo.","severity":"low","affected_scenes":[7,8,11,13]},
      {"title":"El montaje final es genérico","detail":"La escena 14 de clientes satisfechos podría ser más específica. Mostrar las mismas transformaciones del vídeo da más coherencia narrativa.","severity":"medium","affected_scenes":[14]}
    ]',
    '[
      {"title":"Añadir transición visual antes de prótesis","detail":"Insertar un plano de Nerea caminando hacia su sala privada como puente entre servicios generales y prótesis.","type":"add_scene","priority":"high","auto_applicable":true},
      {"title":"Antes/después split-screen","detail":"Añadir un frame de split-screen antes/después del cliente de prótesis para redes sociales. Extremadamente compartible.","type":"add_scene","priority":"medium","auto_applicable":true},
      {"title":"Versión corta 30s para TikTok","detail":"Con las escenas N1, E3, E4A, N7, E9 se puede generar un corte de 30 segundos ideal para TikTok/Reels.","type":"derive_video","priority":"high","auto_applicable":false}
    ]',
    82,
    'El vídeo tiene una estructura narrativa sólida con un arco emocional bien construido. El gancho ASMR es efectivo para YouTube. La sección de prótesis capilares es el punto fuerte y diferenciador. Los prompts son técnicamente buenos y consistentes. Las áreas de mejora son menores: suavizar transiciones y añadir variedad de ángulos. Recomendación principal: crear una versión corta de 30s para TikTok aprovechando las escenas más impactantes.',
    'gpt-4o',
    'ready',
    TRUE
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 16. AI CONVERSATION (example chat)
  -- =============================================
  INSERT INTO public.ai_conversations (
    id, project_id, video_id, user_id,
    conversation_type, title, message_count, completed,
    context_entity_type, context_entity_id,
    messages, affected_scene_ids
  ) VALUES (
    v_conv_id, v_project_id, v_video_id, v_owner_id,
    'scene_creation',
    'Creación de escenas — Video YouTube 90s',
    6,
    TRUE,
    'video', v_video_id,
    '[
      {"role":"ai","content":"¡Hola! Vamos a crear las escenas del vídeo \"Presentación Domenech — YouTube 90s\". El vídeo debe durar 90 segundos, estilo Pixar 3D, para YouTube.\n\nEmpecemos por la primera escena. ¿Qué quieres que se vea al inicio del vídeo? ¿Tienes alguna idea para el gancho?","timestamp":"2025-03-20T10:00:00Z","actions":null},
      {"role":"user","content":"Quiero que el vídeo empiece con algo que enganche, algo visual e hipnótico, tipo ASMR. Que las tijeras brillen.","timestamp":"2025-03-20T10:00:30Z"},
      {"role":"ai","content":"¡Me encanta la idea del ASMR! Voy a crear un cold open con tijeras profesionales cromadas en extreme close-up, slow motion, contra fondo negro con iluminación lateral dramática.\n\nPara maximizar el impacto, te sugiero:\n- **Plano:** Extreme close-up (solo las tijeras y el mechón)\n- **Movimiento:** Estático (todo el movimiento es del mechón cayendo)\n- **Luz:** Lateral dramática para reflejos hipnóticos en el metal\n- **Sonido:** Solo tijeras amplificadas, sin música\n\n¿Te parece bien? ¿Quieres que genere la escena así?","timestamp":"2025-03-20T10:00:32Z","actions":[{"type":"suggest_camera","data":{"angle":"extreme_close_up","movement":"static"}}]},
      {"role":"user","content":"Sí, perfecto. Genera la escena. Y después quiero que el pelo cortado se convierta en el logo de DOMENECH de forma mágica.","timestamp":"2025-03-20T10:01:00Z"},
      {"role":"ai","content":"✅ **Escena 1 creada:** Cold open tijeras ASMR (5s)\n✅ **Escena 2 creada:** Logo reveal DOMENECH dorado (5s)\n\nHe vinculado las dos escenas narrativamente: el mechón dorado cortado se descompone en partículas que se reorganizan formando las letras DOMENECH. El push-in de cámara durante la formación de letras crea un efecto de descubrimiento premium.\n\nPara el generador Grok (6s por clip), ambas escenas encajan en un clip base cada una.\n\n¿Seguimos con la escena 3? ¿Quieres mostrar el exterior del salón o ir directamente al equipo?","timestamp":"2025-03-20T10:01:02Z","actions":[{"type":"scene_created","scene_id":"'|| v_sc_n1 ||'"},{"type":"scene_created","scene_id":"'|| v_sc_e1 ||'"},{"type":"prompt_generated","count":2}]},
      {"role":"user","content":"Muestra primero el exterior para que se vea lo bonito que es el salón y luego al equipo junto dentro.","timestamp":"2025-03-20T10:01:30Z"}
    ]',
    ARRAY[v_sc_n1, v_sc_e1, v_sc_e2, v_sc_e3]
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 17. ENTITY SNAPSHOTS (for rollback)
  -- =============================================
  -- Snapshot of scene N1 before any AI modification
  INSERT INTO public.entity_snapshots (
    entity_type, entity_id,
    conversation_id, action_type,
    snapshot_data, user_id, project_id
  ) VALUES (
    'scene', v_sc_n1,
    v_conv_id, 'create',
    '{"title":"Cold open: tijeras ASMR","description":"Pantalla en negro. Se escucha un sonido amplificado de tijeras...","status":"prompt_ready","scene_number":1}',
    v_owner_id, v_project_id
  ) ON CONFLICT DO NOTHING;

  -- =============================================
  -- 18. SOCIAL PROFILES
  -- =============================================
  INSERT INTO public.social_profiles (
    id, project_id, platform,
    account_name, account_handle, avatar_url,
    bio, followers_count
  ) VALUES
  (v_social_ig, v_project_id, 'instagram',
   'Domenech Peluquerías', '@domenech.peluquerias', NULL,
   '✂️ Estilismo · Barbería · Prótesis capilares\n📍 Valencia\n📞 958 124 555\n💫 Tu mejor versión empieza aquí',
   2340),
  (v_social_tk, v_project_id, 'tiktok',
   'Domenech Peluquerías', '@domenech.peluquerias', NULL,
   '✂️ Transformaciones capilares 💫',
   890)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 19. PUBLICATIONS (3 examples)
  -- =============================================
  INSERT INTO public.publications (
    id, project_id, social_profile_id,
    title, description, caption,
    publication_type, status,
    scheduled_at, hashtags,
    prompt_style_notes
  ) VALUES
  -- Pub 1: Antes/después transformación
  (v_pub_1, v_project_id, v_social_ig,
   'Transformación capilar — Antes/Después',
   'Publicación tipo antes/después mostrando una transformación con prótesis capilar.',
   'No cambias de pelo, cambias de vida. ✨\n\nCada transformación es única, cada cliente es especial.\n\n📞 Pide tu consulta gratuita.\n\n#prótesiscapilar #transformación #alopecia #domenech #peluquería #valencia',
   'image',
   'scheduled',
   '2025-03-25 10:00:00+01',
   ARRAY['prótesiscapilar','transformación','alopecia','domenech','peluquería','valencia'],
   'Split-screen antes/después con estética Domenech: fondo oscuro, tipografía dorada, "ANTES" y "DESPUÉS" en letras espaciadas. Subtítulo "Tu mejor versión empieza aquí" en la parte inferior.'),

  -- Pub 2: Educativo — prótesis
  (v_pub_2, v_project_id, v_social_ig,
   'Mitos y verdades: ¿Se nota una prótesis?',
   'Post educativo desmontando mitos sobre las prótesis capilares.',
   '¿Se nota una prótesis capilar? 🤔\n\nLa respuesta te va a sorprender... Desliza para descubrirlo →\n\nSpoiler: NO, si está bien hecha. Y en Domenech, están MUY bien hechas. 💫\n\n#prótesiscapilar #mitos #alopecia #peluquería #confianza',
   'carousel',
   'draft',
   NULL,
   ARRAY['prótesiscapilar','mitos','alopecia','peluquería','confianza'],
   'Carrusel de 4 imágenes: 1) Portada con pregunta, 2) Mito explicado, 3) Realidad con foto, 4) CTA. Estética oscura con dorados Domenech.'),

  -- Pub 3: Reel del video generado
  (v_pub_3, v_project_id, v_social_tk,
   'VUELVE A BRILLAR — Reel motivacional',
   'Reel corto con el claim principal de Domenech.',
   'Donde la confianza se lleva puesta 💫✂️\n\n#peluquería #domenech #vuelveabrillar #confianza',
   'video',
   'draft',
   NULL,
   ARRAY['peluquería','domenech','vuelveabrillar','confianza'],
   'Texto grande "VUELVE A BRILLAR" sobre fondo oscuro con destellos dorados. Subtítulo "Donde la confianza se lleva puesta". Estilo premium Domenech.')
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 20. PUBLICATION ITEMS
  -- =============================================
  INSERT INTO public.publication_items (
    publication_id, item_type, sort_order,
    prompt_text, description_es
  ) VALUES
  -- Pub 1: single image antes/después
  (v_pub_1, 'image', 1,
   'Split-screen before and after hair prosthetic transformation, left side showing balding middle-aged man in dim lighting labeled ANTES, right side showing same man with full natural hair in warm golden lighting labeled DESPUÉS, Domenech golden brand colors, dark elegant background, golden divider line between sides, text "Tu mejor versión empieza aquí" at bottom in golden typography, premium hair salon aesthetic, 4K',
   'Imagen split-screen antes/después de transformación capilar con prótesis. Lado izquierdo: hombre con alopecia. Lado derecho: mismo hombre con pelo natural completo. Estética Domenech dorada.'),

  -- Pub 2: carousel 3 items
  (v_pub_2, 'image', 1,
   'Dark elegant Instagram post, golden text "¿Se nota una prótesis capilar?" in premium serif typography, Domenech golden brand accent, subtle question mark illustration, dark background, Domenech logo watermark, 4K square format',
   'Portada del carrusel con la pregunta principal sobre prótesis capilares. Fondo oscuro, texto dorado.'),
  (v_pub_2, 'image', 2,
   'Dark elegant Instagram post, educational content about hair prosthetics myths, golden accent text "La prótesis moderna es indetectable", close-up photo of natural-looking hair prosthetic, dark background with golden details, informative professional layout, 4K square',
   'Slide educativo explicando que las prótesis modernas son indetectables. Foto de prótesis de alta calidad.'),
  (v_pub_2, 'image', 3,
   'Dark elegant Instagram post, CTA slide, golden text "Consulta gratuita" with Domenech branding, contact phone number 958 124 555, dark background, golden call-to-action button design, premium salon aesthetic, 4K square',
   'Slide final con CTA: consulta gratuita y teléfono de contacto. Diseño premium Domenech.'),

  -- Pub 3: video reel
  (v_pub_3, 'video', 1,
   'Pixar Studios 3D animated vertical video 9:16, bold golden text "VUELVE A BRILLAR" appearing with dramatic reveal on dark background, golden sparkles and light rays, subtitle "Donde la confianza se lleva puesta" fading in below, Domenech golden brand aesthetic, premium motivational feel, 4K vertical',
   'Reel vertical con claim principal "VUELVE A BRILLAR" apareciendo dramáticamente con destellos dorados sobre fondo oscuro.')
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 21. NARRATIVE ARCS (6 phases for 90s)
  -- =============================================
  INSERT INTO public.narrative_arcs (
    id, video_id, project_id,
    phase, phase_number, title, description,
    start_second, end_second,
    color, icon, sort_order
  ) VALUES
  (v_arc_1, v_video_id, v_project_id, 'hook', 1, 'Gancho ASMR',
   'Apertura hipnótica con tijeras en slow-mo y logo reveal dorado. Captura atención en los primeros 5 segundos.',
   0, 10, '#E24B4A', 'bolt', 1),
  (v_arc_2, v_video_id, v_project_id, 'build', 2, 'Presentación',
   'Fachada del salón y retrato del equipo. Establece ubicación y presenta a los protagonistas.',
   10, 24, '#BA7517', 'users', 2),
  (v_arc_3, v_video_id, v_project_id, 'build', 3, 'Servicios',
   'Montaje dinámico de servicios: estilismo, barbería, coloración, consulta de prótesis.',
   24, 46, '#BA7517', 'scissors', 3),
  (v_arc_4, v_video_id, v_project_id, 'peak', 4, 'Especialidad — Prótesis',
   'Sección más emotiva: proceso detallado de prótesis capilar desde aplicación de adhesivo hasta reveal.',
   46, 70, '#1D9E75', 'heart', 4),
  (v_arc_5, v_video_id, v_project_id, 'peak', 5, 'Celebración',
   'El equipo celebra junto. Montaje de clientes satisfechos. Clímax emocional.',
   70, 82, '#1D9E75', 'sparkles', 5),
  (v_arc_6, v_video_id, v_project_id, 'close', 6, 'CTA',
   'Tagline "Tu mejor versión empieza aquí" y fachada al atardecer. Llamada a la acción.',
   82, 90, '#185FA5', 'phone', 6)
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- 22. ACTIVITY LOG (sample)
  -- =============================================
  INSERT INTO public.activity_log (project_id, user_id, action, entity_type, entity_id, description) VALUES
    (v_project_id, v_owner_id, 'created', 'project', v_project_id, 'Proyecto "Domenech Peluquerías" creado'),
    (v_project_id, v_owner_id, 'created', 'video', v_video_id, 'Vídeo "Presentación Domenech — YouTube 90s" creado'),
    (v_project_id, v_owner_id, 'generated', 'scene', v_sc_n1, 'Escena "Cold open: tijeras ASMR" generada por IA'),
    (v_project_id, v_owner_id, 'generated', 'scene', v_sc_e1, 'Escena "Logo reveal: DOMENECH dorado" generada por IA'),
    (v_project_id, v_owner_id, 'analyzed', 'video', v_video_id, 'Análisis IA completado: puntuación 82/100')
  ON CONFLICT DO NOTHING;

END;
$$;

COMMIT;
