/**
 * Contenido por defecto para páginas del Sello (HTML).
 */

export const CONTENIDO_PROCESO = `
<p class="lead">El camino que debe recorrer un municipio para obtener el Sello de Los Pueblos más Bonitos de España consta de tres etapas fundamentales. El objetivo es superar la Carta de Calidad que rige la asociación.</p>

<hr>

<h2>Etapa 1: Petición formal</h2>
<p>El pueblo manifiesta su voluntad de entrar en la asociación mediante una <strong>petición formal aprobada en el pleno municipal</strong>. Es el primer paso obligatorio: el ayuntamiento debe solicitar oficialmente su adhesión.</p>

<hr>

<h2>Etapa 2: Evaluación in situ</h2>
<p>Una vez la asociación recibe la petición formal, <strong>se inicia el proceso de evaluación del pueblo</strong>. Para ello:</p>
<ul>
  <li>Se realiza una <strong>visita física</strong> al municipio</li>
  <li>Se elabora un <strong>reportaje videofotográfico</strong> y con drones</li>
  <li>Se mantienen <strong>entrevistas con el equipo de gobierno</strong> (alcalde y concejales)</li>
</ul>
<p>Con toda esta información se prepara el expediente para la siguiente fase.</p>

<hr>

<h2>Etapa 3: Comisión de Calidad</h2>
<p>En la <strong>reunión de la Comisión de Calidad</strong>, que tiene lugar a <strong>finales de año</strong>, se decide qué pueblos pueden pasar el corte y se aprueba la auditoría final.</p>
<p>La <strong>Comisión de Calidad</strong> está formada por <strong>siete personas</strong> y es el órgano que determina, tras analizar todo el expediente, si el pueblo cumple los estándares exigidos por la Carta de Calidad.</p>
`;

export const CONTENIDO_CRITERIOS = `
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Requisitos de admisión</h3>
    <p class="mb-4 text-sm text-muted-foreground">Criterios obligatorios que todo municipio debe cumplir.</p>
    <ul class="space-y-2 text-sm">
      <li>• Población máxima de 15.000 habitantes (hasta +10% bajo validación de la Comisión de Calidad). Criterio eliminatorio.</li>
      <li>• Patrimonio arquitectónico o natural certificado por documento en poder del ayuntamiento.</li>
    </ul>
  </div>
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Calidad urbanística</h3>
    <p class="mb-4 text-sm text-muted-foreground">Coherencia y accesibilidad del tejido urbano.</p>
    <ul class="space-y-2 text-sm">
      <li>• Calidad del acceso al pueblo</li>
      <li>• Homogeneidad y dimensión de la masa construida</li>
      <li>• Diversidad de rutas</li>
    </ul>
  </div>
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Calidad arquitectónica</h3>
    <p class="mb-4 text-sm text-muted-foreground">Armonía y conservación del patrimonio edificado.</p>
    <ul class="space-y-2 text-sm">
      <li>• Armonía de edificios, materiales, fachadas y tejados</li>
      <li>• Homogeneidad de ventanas, puertas y colores</li>
      <li>• Presencia de elementos decorativos simbólicos</li>
    </ul>
  </div>
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Valorización</h3>
    <p class="mb-4 text-sm text-muted-foreground">Política activa de mejora y cuidado del patrimonio.</p>
    <ul class="space-y-2 text-sm">
      <li>• Cerrado a coches en casco antiguo (permanente o temporal)</li>
      <li>• Aparcamiento organizado y tratamiento de líneas aéreas</li>
      <li>• Renovación de fachadas, iluminación y espacios públicos</li>
      <li>• Cuidado de zonas verdes y flores</li>
    </ul>
  </div>
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Desarrollo y promoción</h3>
    <p class="mb-4 text-sm text-muted-foreground">Infraestructura turística y oferta de servicios.</p>
    <ul class="space-y-2 text-sm">
      <li>• Conocimiento del número de turistas</li>
      <li>• Oferta de alojamiento, restauración y actividades</li>
      <li>• Punto de información, visitas guiadas y señalización</li>
      <li>• Guías o documentos promocionales</li>
    </ul>
  </div>
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="mb-2 font-semibold">Animación</h3>
    <p class="mb-4 text-sm text-muted-foreground">Vida cultural y eventos que dinamizan el pueblo.</p>
    <ul class="space-y-2 text-sm">
      <li>• Espacios para actos festivos (cubiertos o al aire libre)</li>
      <li>• Organización de eventos originales y de calidad</li>
      <li>• Manifestaciones permanentes o temporales</li>
    </ul>
  </div>
</div>
`;

export const CONTENIDO_COMO_SE_OBTIENE = `
<p>Requisitos y proceso para que un pueblo pueda optar a la certificación. El camino consta de <strong>tres etapas</strong>.</p>
<p>Conoce el <strong>proceso de selección</strong> y los <strong>criterios de evaluación</strong>:</p>

<div class="grid gap-6 md:grid-cols-2 mt-8">
  <a href="/el-sello/proceso" class="block group">
    <article class="relative h-full overflow-hidden rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <span aria-hidden>📋</span>
      </div>
      <h3 class="mb-3 text-xl font-semibold">Proceso de selección</h3>
      <p class="mb-6 text-muted-foreground">Conoce las etapas que debe superar un municipio desde la solicitud inicial hasta la obtención definitiva del sello de calidad.</p>
      <span class="inline-flex items-center gap-2 font-medium text-primary">Ver proceso →</span>
    </article>
  </a>
  <a href="/el-sello/criterios" class="block group">
    <article class="relative h-full overflow-hidden rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <span aria-hidden>✓</span>
      </div>
      <h3 class="mb-3 text-xl font-semibold">Criterios de evaluación</h3>
      <p class="mb-6 text-muted-foreground">Descubre los estándares de calidad en patrimonio, urbanismo, paisaje y gestión que deben cumplir los pueblos candidatos.</p>
      <span class="inline-flex items-center gap-2 font-medium text-primary">Ver criterios →</span>
    </article>
  </a>
</div>
`;

export const CONTENIDO_INTERNACIONAL = `
<h2>Les Plus Beaux Villages de la Terre</h2>
<p>Formamos parte de la red internacional <strong>Les Plus Beaux Villages de la Terre</strong>, que agrupa a las asociaciones nacionales de los pueblos más bonitos del mundo y promueve el intercambio de experiencias, la calidad turística y la preservación del patrimonio.</p>
<p>Actualmente, la red cuenta con <strong>7 países miembros oficiales</strong>:</p>

<div class="grid-paises-internacional">
  <div class="pais-card">
    <h3>🇫🇷 Francia</h3>
    <p><strong>Les Plus Beaux Villages de France</strong> — Desde 1982. La asociación pionera que dio origen a la red mundial.</p>
    <p><a href="https://www.les-plus-beaux-villages-de-france.org" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇧🇪 Valonia (Bélgica)</h3>
    <p><strong>Les Plus Beaux Villages de Wallonie</strong> — Desde 1994. Los pueblos con más encanto de la región francófona belga.</p>
    <p><a href="https://www.beauxvillages.be" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇮🇹 Italia</h3>
    <p><strong>I Borghi più belli d'Italia</strong> — Desde 2001. Una de las redes más extensas con cientos de pueblos certificados.</p>
    <p><a href="https://www.borghipiubelliditalia.it" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇯🇵 Japón</h3>
    <p><strong>The Most Beautiful Villages in Japan</strong> — Desde 2005. La extensión de la red en Asia.</p>
    <p><a href="https://utsukushii-mura.jp" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇪🇸 España</h3>
    <p><strong>Los Pueblos Más Bonitos de España</strong> — Formamos parte de la red desde nuestros inicios.</p>
    <p><a href="/el-sello" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇨🇦 Quebec (Canadá)</h3>
    <p><strong>Les Plus Beaux Villages du Québec</strong> — Desde 1998. Los pueblos más bonitos de la provincia canadiense.</p>
    <p><a href="https://beauxvillages.qc.ca" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
  <div class="pais-card">
    <h3>🇨🇭 Suiza</h3>
    <p><strong>Les Plus Beaux Villages de Suisse</strong> — Desde 2015. Municipios pintorescos de Suiza y Liechtenstein con patrimonio excepcional.</p>
    <p><a href="https://borghisvizzera.ch" target="_blank" rel="noopener noreferrer">Más información →</a></p>
  </div>
</div>

<p>La red internacional coordina esfuerzos para compartir buenas prácticas, promover el turismo responsable y defender el valor de los pequeños núcleos rurales con patrimonio excepcional.</p>

<h2>Países observadores</h2>
<p>Además, varios países participan como <strong>miembros observadores</strong>, en proceso de incorporación a la red:</p>
<ul>
  <li>🇱🇧 <strong>Líbano</strong> — <a href="https://www.pbvliban.org/fr/" target="_blank" rel="noopener noreferrer">Web oficial</a></li>
  <li>🇷🇺 <strong>Rusia</strong> — <a href="https://eng.krasaderevni.ru" target="_blank" rel="noopener noreferrer">Web oficial</a></li>
  <li>🇨🇳 <strong>China</strong> — <a href="http://www.zmxzchina.com/index.html" target="_blank" rel="noopener noreferrer">Web oficial</a></li>
  <li>🇧🇦 <strong>Bosnia-Herzegovina</strong> — <a href="https://mbv.ba/en/about-mbv-initiative/" target="_blank" rel="noopener noreferrer">Web oficial</a></li>
  <li>🇩🇪 <strong>Alemania</strong> — <a href="https://www.schoenste-doerfer.de" target="_blank" rel="noopener noreferrer">Web oficial</a></li>
</ul>
`;

export const CONTENIDO_SOCIOS = `
<p>Conoce a las instituciones, colaboradores y entidades que forman parte de nuestro proyecto y contribuyen a la promoción del patrimonio rural español.</p>
<p>La asociación cuenta con socios institucionales (municipios certificados) y colaboradores que apoyan nuestra misión de preservar y dar a conocer los pueblos más bonitos de España.</p>
`;

export const CONTENIDO_UNETE = `
<p>¿Tu pueblo cumple los requisitos? Descubre cómo unirte a la red de Los Pueblos Más Bonitos de España y formar parte de un proyecto único de promoción del patrimonio rural.</p>
<h2>Para municipios</h2>
<p>Si eres alcalde o representante de un ayuntamiento y crees que tu pueblo cumple con los criterios de calidad, puedes iniciar el proceso de candidatura.</p>
<ol>
  <li><strong>Consulta los requisitos</strong> — Revisa los criterios de evaluación y la Carta de Calidad.</li>
  <li><strong>Aprobación en pleno</strong> — El ayuntamiento debe aprobar formalmente la solicitud.</li>
  <li><strong>Envía la solicitud</strong> — Completa el formulario oficial con la documentación requerida.</li>
</ol>
<h2>Para colaboradores</h2>
<p>Empresas, instituciones y organizaciones pueden colaborar con la asociación a través de diferentes modalidades de patrocinio y colaboración:</p>
<ul>
  <li>Patrocinio de eventos y actividades</li>
  <li>Colaboración en proyectos de promoción</li>
  <li>Acuerdos de visibilidad y comunicación</li>
  <li>Apoyo a iniciativas de sostenibilidad</li>
</ul>
<h2>Beneficios de pertenecer a la red</h2>
<ul>
  <li><strong>Visibilidad</strong> — Promoción en medios nacionales e internacionales y presencia en ferias de turismo.</li>
  <li><strong>Turismo</strong> — Incremento significativo de visitantes y pernoctaciones en el municipio.</li>
  <li><strong>Red internacional</strong> — Pertenencia a la red mundial de pueblos más bonitos con presencia en varios países.</li>
  <li><strong>Desarrollo económico</strong> — Impulso a la economía local con nuevos negocios y oportunidades de empleo.</li>
</ul>
`;
