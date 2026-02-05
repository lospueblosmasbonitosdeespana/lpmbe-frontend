/**
 * Contenido por defecto para páginas del Sello (HTML).
 */

export const CONTENIDO_PROCESO = `
<p class="text-lg text-muted-foreground">El camino que debe recorrer un municipio para obtener el Sello de Los Pueblos más Bonitos de España consta de tres etapas fundamentales. El objetivo es superar la Carta de Calidad que rige la asociación.</p>

<div class="mt-12 space-y-12 lg:space-y-16">
  <div class="group relative">
    <div class="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div class="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">1</div>
      <div class="ml-6 sm:ml-8">
        <h3 class="mb-4 text-xl font-semibold sm:text-2xl">Petición formal</h3>
        <p class="text-muted-foreground">El pueblo manifiesta su voluntad de entrar en la asociación mediante una <strong class="text-foreground">petición formal aprobada en el pleno municipal</strong>. Es el primer paso obligatorio: el ayuntamiento debe solicitar oficialmente su adhesión.</p>
      </div>
    </div>
  </div>

  <div class="group relative">
    <div class="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div class="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">2</div>
      <div class="ml-6 sm:ml-8">
        <h3 class="mb-4 text-xl font-semibold sm:text-2xl">Evaluación in situ</h3>
        <p class="mb-4 text-muted-foreground">Una vez la asociación recibe la petición formal, <strong class="text-foreground">se inicia el proceso de evaluación del pueblo</strong>. Para ello:</p>
        <ul class="mb-4 space-y-2 text-muted-foreground">
          <li class="flex items-start gap-3"><span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>Se realiza una <strong class="text-foreground">visita física</strong> al municipio</li>
          <li class="flex items-start gap-3"><span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>Se elabora un <strong class="text-foreground">reportaje videofotográfico</strong> y con drones</li>
          <li class="flex items-start gap-3"><span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>Se mantienen <strong class="text-foreground">entrevistas con el equipo de gobierno</strong> (alcalde y concejales)</li>
        </ul>
        <p class="text-muted-foreground">Con toda esta información se prepara el expediente para la siguiente fase.</p>
      </div>
    </div>
  </div>

  <div class="group relative">
    <div class="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div class="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">3</div>
      <div class="ml-6 sm:ml-8">
        <h3 class="mb-4 text-xl font-semibold sm:text-2xl">Comisión de Calidad</h3>
        <p class="mb-4 text-muted-foreground">En la <strong class="text-foreground">reunión de la Comisión de Calidad</strong>, que tiene lugar a <strong class="text-foreground">finales de año</strong>, se decide qué pueblos pueden pasar el corte y se aprueba la auditoría final.</p>
        <p class="text-muted-foreground">La <strong class="text-foreground">Comisión de Calidad</strong> está formada por <strong class="text-foreground">siete personas</strong> y es el órgano que determina, tras analizar todo el expediente, si el pueblo cumple los estándares exigidos por la Carta de Calidad.</p>
      </div>
    </div>
  </div>
</div>
`;

export const CONTENIDO_CRITERIOS = `
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Requisitos de admisión</h3>
    <p class="mb-4 text-sm text-muted-foreground">Criterios obligatorios que todo municipio debe cumplir.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Población máxima de 15.000 habitantes (hasta +10% bajo validación de la Comisión de Calidad). Criterio eliminatorio.</li>
      <li>• Patrimonio arquitectónico o natural certificado por documento en poder del ayuntamiento.</li>
    </ul>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Calidad urbanística</h3>
    <p class="mb-4 text-sm text-muted-foreground">Coherencia y accesibilidad del tejido urbano.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Calidad del acceso al pueblo</li>
      <li>• Homogeneidad y dimensión de la masa construida</li>
      <li>• Diversidad de rutas</li>
    </ul>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M12 2L2 7h20L12 2z"/><path d="M2 17h20"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Calidad arquitectónica</h3>
    <p class="mb-4 text-sm text-muted-foreground">Armonía y conservación del patrimonio edificado.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Armonía de edificios, materiales, fachadas y tejados</li>
      <li>• Homogeneidad de ventanas, puertas y colores</li>
      <li>• Presencia de elementos decorativos simbólicos</li>
    </ul>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Valorización</h3>
    <p class="mb-4 text-sm text-muted-foreground">Política activa de mejora y cuidado del patrimonio.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Cerrado a coches en casco antiguo (permanente o temporal)</li>
      <li>• Aparcamiento organizado y tratamiento de líneas aéreas</li>
      <li>• Renovación de fachadas, iluminación y espacios públicos</li>
      <li>• Cuidado de zonas verdes y flores</li>
    </ul>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Desarrollo y promoción</h3>
    <p class="mb-4 text-sm text-muted-foreground">Infraestructura turística y oferta de servicios.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Conocimiento del número de turistas</li>
      <li>• Oferta de alojamiento, restauración y actividades</li>
      <li>• Punto de información, visitas guiadas y señalización</li>
      <li>• Guías o documentos promocionales</li>
    </ul>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" class="h-6 w-6"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
    </div>
    <h3 class="mb-2 font-semibold">Animación</h3>
    <p class="mb-4 text-sm text-muted-foreground">Vida cultural y eventos que dinamizan el pueblo.</p>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• Espacios para actos festivos (cubiertos o al aire libre)</li>
      <li>• Organización de eventos originales y de calidad</li>
      <li>• Manifestaciones permanentes o temporales</li>
    </ul>
  </div>
</div>
`;

export const CONTENIDO_COMO_SE_OBTIENE = `
<h2>Cómo obtener el Sello</h2>
<p>Requisitos y proceso para que un pueblo pueda optar a la certificación. El camino consta de <strong>tres etapas</strong>.</p>
<p>Conoce el <strong>proceso de selección</strong> y los <strong>criterios de evaluación</strong>.</p>
`;

export const CONTENIDO_INTERNACIONAL = `
<p class="text-lg text-muted-foreground">Formamos parte de la red internacional <strong class="text-foreground">Les Plus Beaux Villages de la Terre</strong>, que agrupa a las asociaciones nacionales de los pueblos más bonitos del mundo y promueve el intercambio de experiencias, la calidad turística y la preservación del patrimonio.</p>
<p class="text-muted-foreground">Actualmente, la red cuenta con <strong class="text-foreground">7 países miembros oficiales</strong>:</p>

<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇫🇷 Francia</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">Les Plus Beaux Villages de France</strong> — Desde 1982. La asociación pionera que dio origen a la red mundial.</p>
    <p><a href="https://www.les-plus-beaux-villages-de-france.org" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇧🇪 Valonia (Bélgica)</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">Les Plus Beaux Villages de Wallonie</strong> — Desde 1994. Los pueblos con más encanto de la región francófona belga.</p>
    <p><a href="https://www.beauxvillages.be" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇮🇹 Italia</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">I Borghi più belli d'Italia</strong> — Desde 2001. Una de las redes más extensas con cientos de pueblos certificados.</p>
    <p><a href="https://www.borghipiubelliditalia.it" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇯🇵 Japón</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">The Most Beautiful Villages in Japan</strong> — Desde 2005. La extensión de la red en Asia.</p>
    <p><a href="https://utsukushii-mura.jp" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇪🇸 España</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">Los Pueblos Más Bonitos de España</strong> — Formamos parte de la red desde nuestros inicios.</p>
    <p><a href="/el-sello" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇨🇦 Quebec (Canadá)</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">Les Plus Beaux Villages du Québec</strong> — Desde 1998. Los pueblos más bonitos de la provincia canadiense.</p>
    <p><a href="https://beauxvillages.qc.ca" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
  <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
    <h3 class="mb-3 text-lg font-semibold">🇨🇭 Suiza</h3>
    <p class="mb-4 text-sm text-muted-foreground"><strong class="text-foreground">Les Plus Beaux Villages de Suisse</strong> — Desde 2015. Municipios pintorescos de Suiza y Liechtenstein con patrimonio excepcional.</p>
    <p><a href="https://borghisvizzera.ch" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary underline hover:no-underline">Más información →</a></p>
  </div>
</div>

<p class="mt-8 text-muted-foreground">La red internacional coordina esfuerzos para compartir buenas prácticas, promover el turismo responsable y defender el valor de los pequeños núcleos rurales con patrimonio excepcional.</p>

<h2 class="mt-10 text-xl font-semibold">Países observadores</h2>
<p class="text-muted-foreground">Además, varios países participan como <strong class="text-foreground">miembros observadores</strong>, en proceso de incorporación a la red:</p>
<ul class="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
  <li>🇱🇧 <strong class="text-foreground">Líbano</strong> — <a href="https://www.pbvliban.org/fr/" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">Web oficial</a></li>
  <li>🇷🇺 <strong class="text-foreground">Rusia</strong> — <a href="https://eng.krasaderevni.ru" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">Web oficial</a></li>
  <li>🇨🇳 <strong class="text-foreground">China</strong> — <a href="http://www.zmxzchina.com/index.html" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">Web oficial</a></li>
  <li>🇧🇦 <strong class="text-foreground">Bosnia-Herzegovina</strong> — <a href="https://mbv.ba/en/about-mbv-initiative/" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">Web oficial</a></li>
  <li>🇩🇪 <strong class="text-foreground">Alemania</strong> — <a href="https://www.schoenste-doerfer.de" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">Web oficial</a></li>
</ul>
`;

export const CONTENIDO_SOCIOS = `
<p>Conoce a las instituciones, colaboradores y entidades que forman parte de nuestro proyecto y contribuyen a la promoción del patrimonio rural español.</p>
<p>La asociación cuenta con socios institucionales (municipios certificados) y colaboradores que apoyan nuestra misión de preservar y dar a conocer los pueblos más bonitos de España.</p>
`;

export const CONTENIDO_QUIENES_SOMOS = `
<p>La <strong>Asociación Los Pueblos Más Bonitos de España</strong> es una entidad sin ánimo de lucro fundada en 2010 que agrupa a los municipios españoles que destacan por su patrimonio, belleza y singularidad.</p>

<p>Nuestra misión es <strong>proteger, promover y desarrollar</strong> el patrimonio rural español, fomentando un turismo sostenible y de calidad que contribuya al desarrollo de estos enclaves únicos. La marca "Los Pueblos Más Bonitos de España" distingue a aquellos municipios que cumplen rigurosos criterios recogidos en nuestra Carta de Calidad.</p>

<p>La asociación está gobernada por una <strong>Comisión de Calidad</strong> formada por siete personas, encargada de evaluar las candidaturas, verificar el cumplimiento de los criterios y velar por el buen uso de la marca. Los pueblos miembros se comprometen a mantener los estándares exigidos y a invertir en la conservación y promoción de su patrimonio.</p>

<p>Formamos parte de la red internacional <em>Les Plus Beaux Villages de la Terre</em>, que reúne a asociaciones de Francia, Italia, Bélgica, Japón, Canadá, Suiza y otros países, compartiendo criterios de excelencia y buenas prácticas en la promoción del patrimonio rural.</p>

<p>Actualmente más de <strong>126 pueblos</strong> en <strong>17 comunidades autónomas</strong> forman parte de nuestra red, generando impacto positivo en la economía local, el turismo y la preservación del patrimonio cultural español.</p>

<p>Si quieres conocer el proceso para que tu municipio obtenga el sello de calidad, consulta nuestra sección de <a href="/el-sello/como-se-obtiene" class="text-primary underline hover:no-underline">cómo se obtiene el sello</a>.</p>
`;

export const CONTENIDO_UNETE = `
<p>¿Tu pueblo cumple los requisitos? Descubre cómo unirte a la red de Los Pueblos Más Bonitos de España y formar parte de un proyecto único de promoción del patrimonio rural.</p>

<p>Si eres <strong>alcalde o representante de un ayuntamiento</strong> y crees que tu municipio cumple con los criterios de calidad, puedes iniciar el proceso de candidatura siguiendo estos pasos:</p>

<ol class="list-decimal pl-6 space-y-2">
  <li><strong>Consulta los requisitos</strong> — Revisa los criterios de evaluación y la Carta de Calidad.</li>
  <li><strong>Aprobación en pleno</strong> — El ayuntamiento debe aprobar formalmente la solicitud.</li>
  <li><strong>Envía la solicitud</strong> — Completa el formulario oficial con la documentación requerida.</li>
</ol>

<p>Para <strong>empresas, instituciones y organizaciones</strong> que quieran colaborar con la asociación, ofrecemos diferentes modalidades de patrocinio y colaboración:</p>

<ul class="list-disc pl-6 space-y-1">
  <li>Patrocinio de eventos y actividades</li>
  <li>Colaboración en proyectos de promoción</li>
  <li>Acuerdos de visibilidad y comunicación</li>
  <li>Apoyo a iniciativas de sostenibilidad</li>
</ul>

<p>Contacta con nosotros para más información sobre cómo participar.</p>
`;

export const CONTENIDO_SELLO_HOME = `
<p>El <strong>Sello de Los Pueblos Más Bonitos de España</strong> es una marca de calidad turística que distingue a aquellos municipios que cumplen con rigurosos criterios de patrimonio, conservación y compromiso con el visitante.</p>

<p>Otorgado por nuestra asociación, el sello garantiza una <strong>experiencia auténtica</strong> en cada pueblo certificado. Actualmente, más de <strong>126 pueblos</strong> en <strong>17 comunidades autónomas</strong> lucen este distintivo de excelencia.</p>

<p>Cada pueblo candidato es evaluado según seis pilares fundamentales:</p>

<ul class="list-disc pl-6 space-y-1">
  <li><strong>Patrimonio arquitectónico</strong> — Conservación del conjunto urbano y edificaciones de valor histórico.</li>
  <li><strong>Riqueza histórica</strong> — Legado cultural y tradiciones vivas.</li>
  <li><strong>Entorno natural</strong> — Integración armónica con el paisaje.</li>
  <li><strong>Vida local</strong> — Población residente y actividad económica.</li>
  <li><strong>Sostenibilidad</strong> — Políticas de conservación y desarrollo compatible.</li>
  <li><strong>Acogida al visitante</strong> — Infraestructura turística de calidad.</li>
</ul>

<p>Formamos parte de la red internacional <em>Les Plus Beaux Villages de la Terre</em>, que agrupa a asociaciones de Francia, Italia, Bélgica, Japón, Canadá, Suiza y otros países.</p>
`;
