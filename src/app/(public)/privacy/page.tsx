export default function PrivacyPage() {
  return (
    <article className="prose prose-sm prose-invert max-w-none">
      <h1>Política de Privacidad</h1>
      <p className="text-foreground-secondary">Última actualización: 19 de marzo de 2026</p>

      <h2>1. Información que Recopilamos</h2>
      <p>Recopilamos la siguiente información cuando utilizas Kiyoko AI:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, email y contraseña (encriptada)</li>
        <li><strong>Datos de uso:</strong> proyectos creados, escenas, prompts generados</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo</li>
      </ul>

      <h2>2. Cómo Utilizamos tu Información</h2>
      <p>Utilizamos tus datos para:</p>
      <ul>
        <li>Proporcionar y mantener el Servicio</li>
        <li>Mejorar la experiencia de usuario</li>
        <li>Enviar comunicaciones relacionadas con el Servicio</li>
        <li>Generar contenido con IA según tus instrucciones</li>
      </ul>

      <h2>3. Almacenamiento y Seguridad</h2>
      <p>
        Tus datos se almacenan en servidores seguros proporcionados por Supabase.
        Utilizamos encriptación en tránsito (TLS) y en reposo para proteger tu información.
      </p>

      <h2>4. Servicios de Terceros</h2>
      <p>Utilizamos los siguientes servicios de terceros que pueden procesar tus datos:</p>
      <ul>
        <li><strong>Supabase:</strong> autenticación y base de datos</li>
        <li><strong>Vercel:</strong> hosting y despliegue</li>
        <li><strong>Proveedores de IA:</strong> para generar texto, prompts y audio</li>
        <li><strong>ElevenLabs:</strong> generación de audio de narración</li>
      </ul>

      <h2>5. Tus Derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>Acceder a tus datos personales</li>
        <li>Rectificar información incorrecta</li>
        <li>Eliminar tu cuenta y datos asociados</li>
        <li>Exportar tus datos en formato legible</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        Utilizamos cookies esenciales para la autenticación y el funcionamiento del Servicio.
        No utilizamos cookies de seguimiento de terceros con fines publicitarios.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para consultas sobre privacidad: <strong>privacy@kiyoko.ai</strong>
      </p>
    </article>
  );
}
