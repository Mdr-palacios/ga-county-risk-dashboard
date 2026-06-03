// ---------- I18N ----------
// Three languages: en, es, vi. Active lang persists in localStorage.
// Static HTML strings use data-i18n="key" (or data-i18n-attr="attr:key,attr:key").
// JS-rendered strings use t(key) or t(key, { var: x }).

window.I18N = {
  en: {
    // Document
    'doc.title': 'Georgia County Risk Dashboard · Independent analysis by Rosario Palacios',
    'doc.description': 'Independent analysis by Rosario Palacios tracking county-level immigration enforcement risk across Georgia: 287(g) agreements, surveillance infrastructure, demographics, and observed arrests.',

    // Header
    'header.brand': 'GA County Risk Dashboard',
    'header.sub': 'Independent analysis by Rosario Palacios',
    'header.cta.pill': 'Want one for your state?',
    'header.darkmode.aria': 'Toggle dark mode',
    'header.lang.aria': 'Switch language',

    // Hero
    'hero.h1': 'Tracking immigration enforcement risk across all 159 Georgia counties.',
    'hero.lede': 'Built for activists and organizations who believe we should #AbolishICE. Combines public 287(g) agreements, license-plate surveillance networks (Flock), demographic data, HB 1105 status, and observed enforcement activity into a comparable risk score for every Georgia county. Use it to prioritize where to send legal observers, hotline capacity, and rapid-response volunteers.',
    'hero.meta.model': 'v3 risk model · May 2026',
    'hero.meta.counties': '159 counties',
    'hero.meta.updated': 'Updated quarterly',
    'hero.meta.share': 'Coalition link share only',

    // KPI labels
    'kpi.counties_tracked': 'Counties tracked',
    'kpi.counties_tracked.sub': 'All Georgia counties',
    'kpi.critical_high': 'Critical · High tier',
    'kpi.critical_high.sub': '{critical} Critical · {high} High',
    'kpi.critical_high.donut_lab': 'of counties',
    'kpi.287g': '287(g) agreements',
    'kpi.287g.sub': 'Active local agency partnerships',
    'kpi.cameras': 'ALPR cameras mapped',
    'kpi.cameras.sub': '{flock} confirmed Flock; {counties} counties',
    'kpi.cameras.flock': 'Flock',
    'kpi.cameras.other': 'Other ALPR',
    'kpi.fb': 'Foreign-born residents',
    'kpi.fb.sub': 'Across the state',
    'kpi.arrests': 'Observed arrests',
    'kpi.arrests.sub': 'Across {n} counties; coalition-aggregated',

    // Map section
    'map.h2': 'Risk map · click any county',
    'map.desc': 'Counties shaded by composite risk score (v3). Score combines 287(g) participation, immigrant population share, ICE infrastructure proximity, observed arrests, and surveillance mesh density.',
    'map.mode.risk': 'Risk tier',
    'map.mode.287g': '287(g)',
    'map.mode.flock': 'Flock',
    'map.mode.cameras': 'Cameras',
    'map.mode.fb': '% Foreign-born',
    'map.cameras.toggle': 'Show cameras',
    'map.empty': 'Click a county on the map (or pick from the table below) to see its risk profile, demographics, 287(g) participation, and surveillance footprint.',

    // Legend labels
    'legend.multiple_agencies': 'Multiple agencies',
    'legend.one_agency': 'One agency',
    'legend.no_287g': 'No 287(g)',
    'legend.ice_query': 'Documented ICE query',
    'legend.shares_apd': 'Shares with APD or FUSUS',
    'legend.has_flock': 'Has Flock',
    'legend.no_flock': 'No Flock',
    'legend.fewer_cameras': 'Fewer cameras',
    'legend.more_cameras': 'More cameras (log scale)',
    'legend.lower_pct': 'Lower %',
    'legend.higher_pct': 'Higher %',
    'legend.risk.critical': 'Critical (100+)',
    'legend.risk.high': 'High (70 to 99)',
    'legend.risk.medium': 'Medium (40 to 69)',
    'legend.risk.low': 'Low (< 40)',

    // Charts
    'tier.h2': 'Risk tier distribution',
    'tier.desc': "How counties stack across the four tiers, with their share of GA's foreign-born population and observed arrests.",
    'tier.notes': "Critical and High tier counties contain a disproportionate share of GA's immigrant population. Direct legal observer and hotline capacity here first.",
    'tier.fb_share': 'Foreign-born share by tier',
    'tier.arrests_by_tier': 'Observed arrests by tier',
    'p287g.h2': '287(g) participation by model',
    'p287g.desc': 'Counts of GA local agencies under each 287(g) model. Task Force Model (TFM) re-authorized 2025; allows street-level enforcement.',
    'p287g.notes_prefix': 'Sources:',
    'p287g.notes_src': 'ICE 287(g) program list',
    'p287g.notes_suffix': '; cross-checked against county sheriff and city PD announcements.',
    'surv.h2': 'Surveillance mesh · top 12 counties',
    'surv.desc': 'Composite score of license-plate reader (Flock) deployment, APD data sharing, FUSUS connection, and documented ICE queries through these networks.',
    'surv.notes': 'Mesh score weights: Flock deployed (1) + shares with APD (1) + FUSUS-connected (1) + documented ICE query (2). Cap 5.',
    'method.h2': "What drives a county's score",
    'method.desc': 'Methodology in plain language.',
    'method.row.287g': '287(g) status',
    'method.row.fb': 'Foreign-born %',
    'method.row.hisp': 'Hispanic %',
    'method.row.ice_infra': 'ICE infra',
    'method.row.hb1105': 'HB 1105 base',
    'method.row.arrests': 'Observed arrests',
    'method.row.surv': 'Surveillance mesh',
    'method.notes': 'Tiers: Critical ≥ 100; High 70 to 99; Medium 40 to 69; Low < 40. v3 model adds observed arrests and surveillance mesh on top of the v2 demographic base. The model is directional, not predictive: a county scoring "Medium" is not safe; it just has fewer of the indicators we can track from public sources.',

    // County table
    'tbl.summary_h': 'All counties',
    'tbl.summary_sub': 'Search, sort, and click a row to load it above.',
    'tbl.pill': '{n} counties',
    'tbl.search.placeholder': 'Search counties...',
    'tbl.search.aria': 'Search counties',
    'tbl.filter.tier.aria': 'Filter by risk tier',
    'tbl.filter.tier.all': 'All tiers',
    'tbl.filter.tier.critical': 'Critical only',
    'tbl.filter.tier.high': 'High only',
    'tbl.filter.tier.medium': 'Medium only',
    'tbl.filter.tier.low': 'Low only',
    'tbl.filter.287g.aria': 'Filter by 287(g)',
    'tbl.filter.287g.all': 'All 287(g)',
    'tbl.filter.287g.active': 'Active 287(g)',
    'tbl.filter.287g.inactive': 'No 287(g)',
    'tbl.filter.region.aria': 'Filter by region',
    'tbl.filter.region.all': 'All Georgia',
    'tbl.filter.region.metro': 'Metro Atlanta',
    'tbl.filter.region.nonmetro': 'Outside Metro Atlanta',
    'tbl.col.county': 'County',
    'tbl.col.score': 'Score',
    'tbl.col.tier': 'Tier',
    'tbl.col.287g': '287(g)',
    'tbl.col.flock': 'Flock',
    'tbl.col.fb': 'FB %',
    'tbl.col.hisp': 'Hisp %',
    'tbl.col.arrests': 'Arrests',
    'tbl.col.mesh': 'Mesh',
    'tbl.notes.demographics': 'Demographics:',
    'tbl.notes.census': 'U.S. Census ACS 5-year, 2018 to 2022',
    'tbl.notes.middle': '. 287(g): ICE program list. Surveillance:',
    'tbl.notes.flock_link': 'Flock Safety',
    'tbl.notes.end': 'deployment records cross-referenced against EFF and local reporting. Observed arrests: aggregated coalition incident reports.',

    // Risk tiers (used in many places)
    'tier.critical': 'Critical',
    'tier.high': 'High',
    'tier.medium': 'Medium',
    'tier.low': 'Low',

    // Detail panel
    'detail.county_suffix': 'County',
    'detail.fips': 'FIPS',
    'detail.metro': 'Metro Atlanta',
    'detail.nonmetro': 'Outside Metro Atlanta',
    'detail.pop': 'pop',
    'detail.stat.fb': 'Foreign-born',
    'detail.stat.hisp': 'Hispanic',
    'detail.stat.287g': '287(g) status',
    'detail.stat.hb1105': 'HB 1105',
    'detail.stat.cameras': 'ALPR cameras',
    'detail.stat.cam_per_100k': 'Cameras per 100k',
    'detail.stat.not_participating': 'Not participating',
    'detail.287g_agencies': '287(g) agencies:',
    'detail.ice_infra': 'ICE infrastructure:',
    'detail.score_breakdown': 'Score breakdown',
    'detail.score.287g': '287(g)',
    'detail.score.fb': 'Foreign-born',
    'detail.score.hisp': 'Hispanic %',
    'detail.score.ice_infra': 'ICE infra',
    'detail.score.hb1105': 'HB 1105 base',
    'detail.score.surv': 'Surveillance',
    'detail.score.arrests': 'Observed arrests',
    'detail.tags.287g_count': '{n} × 287(g)',
    'detail.tags.alpr_cameras': '{n} ALPR cameras',
    'detail.tags.ice_query': 'ICE query documented',
    'detail.tags.shares_apd': 'Shares with APD',
    'detail.tags.fusus': 'FUSUS-connected',
    'detail.tags.arrests': '{n} observed arrests',
    'detail.tags.none': 'No tracked indicators',
    'detail.flock_agencies': 'Flock agencies:',
    'detail.surv_flags': 'Surveillance flags:',
    'detail.flock_count': 'Flock',
    'detail.other_alpr': 'Other ALPR',
    'detail.interstates': 'Interstates',
    'detail.cities_towns': 'Cities and towns',
    'detail.zoom.h4': '{county} County: camera footprint',
    'detail.zoom.stat': '<strong>{cams}</strong> cameras; <strong>{per}</strong> per 100k',
    'detail.zoom.aria': '{county} County camera positions',

    // Tooltip
    'tip.score': 'score',
    'tip.no_287g': 'no 287(g)',

    // 287g model bar labels (data-side; only "No 287(g)" replaced)
    'p287g.bar.none': 'No 287(g)',

    // Footer
    'footer.line1.strong': 'Independent analysis by Rosario Palacios.',
    'footer.line1.rest': 'This page combines public records into a comparable risk score for coalition planning. Strategic and personnel data (sheriff contacts, observer rosters, attorney triggers) are intentionally excluded from this view.',
    'footer.contact': 'Questions, corrections, or data updates:',
    'footer.build': 'v3 model · build',
    'footer.audience': 'Built for #AbolishICE coalition partners. Not for public press distribution.',
    'footer.cameras_credit_prefix': 'Camera locations ©',
    'footer.cameras_osm': 'OpenStreetMap contributors',
    'footer.cameras_credit_mid': '; aggregated by',
    'footer.cameras_deflock': 'DeFlock',

    // Partnership banner
    'banner.strong': 'From another state?',
    'banner.body': "If you're an #AbolishICE organizer or coalition working on immigrant rights, voter access, or civil-rights work, I can partner with you to research and build a county-level risk dashboard for your state.",
    'banner.cta': 'Start a conversation',

    // Modals
    'modal.signup.h3': 'Quick check-in before you keep exploring',
    'modal.signup.p': "This dashboard is an independent analysis. If you'd like occasional updates as new data is added, drop your email; either choice keeps the dashboard open.",
    'modal.signup.skip': 'Skip for now',
    'modal.signup.frame_title': 'Stay in the loop',
    'modal.partnership.h3': 'Build this for your state',
    'modal.partnership.p': "Tell me about the state you'd want to assess and the problem you're trying to solve. I'll be in touch within a few days.",
    'modal.partnership.frame_title': 'Build this for your state',
    'modal.close.aria': 'Close',
  },

  es: {
    'doc.title': 'Tablero de Riesgo por Condado de Georgia · Análisis independiente por Rosario Palacios',
    'doc.description': 'Análisis independiente por Rosario Palacios que monitorea el riesgo de aplicación migratoria a nivel de condado en Georgia: acuerdos 287(g), infraestructura de vigilancia, demografía y arrestos observados.',

    'header.brand': 'Tablero de Riesgo · Georgia',
    'header.sub': 'Análisis independiente por Rosario Palacios',
    'header.cta.pill': '¿Quieres uno para tu estado?',
    'header.darkmode.aria': 'Cambiar a modo oscuro',
    'header.lang.aria': 'Cambiar idioma',

    'hero.h1': 'Monitoreando el riesgo de aplicación migratoria en los 159 condados de Georgia.',
    'hero.lede': 'Hecho para activistas y organizaciones que creemos que hay que #AbolirICE. Combina los acuerdos públicos 287(g), las redes de vigilancia de placas (Flock), datos demográficos, el estado de la HB 1105, y la actividad de aplicación observada, en una puntuación de riesgo comparable para cada condado de Georgia. Úsalo para priorizar dónde mandar observadores legales, capacidad de líneas de emergencia, y voluntarios de respuesta rápida.',
    'hero.meta.model': 'modelo de riesgo v3 · mayo 2026',
    'hero.meta.counties': '159 condados',
    'hero.meta.updated': 'Actualizado cada trimestre',
    'hero.meta.share': 'Solo para compartir entre la coalición',

    'kpi.counties_tracked': 'Condados rastreados',
    'kpi.counties_tracked.sub': 'Todos los condados de Georgia',
    'kpi.critical_high': 'Nivel Crítico · Alto',
    'kpi.critical_high.sub': '{critical} Crítico · {high} Alto',
    'kpi.critical_high.donut_lab': 'de los condados',
    'kpi.287g': 'Acuerdos 287(g)',
    'kpi.287g.sub': 'Alianzas activas con agencias locales',
    'kpi.cameras': 'Cámaras ALPR mapeadas',
    'kpi.cameras.sub': '{flock} Flock confirmadas; {counties} condados',
    'kpi.cameras.flock': 'Flock',
    'kpi.cameras.other': 'Otros ALPR',
    'kpi.fb': 'Residentes nacidos en el extranjero',
    'kpi.fb.sub': 'En todo el estado',
    'kpi.arrests': 'Arrestos observados',
    'kpi.arrests.sub': 'En {n} condados; agregados por la coalición',

    'map.h2': 'Mapa de riesgo · haz clic en cualquier condado',
    'map.desc': 'Condados sombreados por puntuación de riesgo compuesta (v3). La puntuación combina la participación en 287(g), la proporción de población inmigrante, la cercanía a infraestructura de ICE, los arrestos observados y la densidad de la red de vigilancia.',
    'map.mode.risk': 'Nivel de riesgo',
    'map.mode.287g': '287(g)',
    'map.mode.flock': 'Flock',
    'map.mode.cameras': 'Cámaras',
    'map.mode.fb': '% nacidos fuera',
    'map.cameras.toggle': 'Mostrar cámaras',
    'map.empty': 'Haz clic en un condado en el mapa (o elige de la tabla abajo) para ver su perfil de riesgo, demografía, participación en 287(g), e infraestructura de vigilancia.',

    'legend.multiple_agencies': 'Varias agencias',
    'legend.one_agency': 'Una agencia',
    'legend.no_287g': 'Sin 287(g)',
    'legend.ice_query': 'Consulta de ICE documentada',
    'legend.shares_apd': 'Comparte con APD o FUSUS',
    'legend.has_flock': 'Tiene Flock',
    'legend.no_flock': 'Sin Flock',
    'legend.fewer_cameras': 'Menos cámaras',
    'legend.more_cameras': 'Más cámaras (escala log)',
    'legend.lower_pct': '% más bajo',
    'legend.higher_pct': '% más alto',
    'legend.risk.critical': 'Crítico (100+)',
    'legend.risk.high': 'Alto (70 a 99)',
    'legend.risk.medium': 'Medio (40 a 69)',
    'legend.risk.low': 'Bajo (< 40)',

    'tier.h2': 'Distribución por nivel de riesgo',
    'tier.desc': 'Cómo se distribuyen los condados en los cuatro niveles, con su parte de la población nacida en el extranjero y los arrestos observados.',
    'tier.notes': 'Los condados de nivel Crítico y Alto contienen una parte desproporcionada de la población inmigrante de Georgia. Dirige primero aquí la capacidad de observadores legales y líneas de emergencia.',
    'tier.fb_share': 'Parte de nacidos fuera por nivel',
    'tier.arrests_by_tier': 'Arrestos observados por nivel',
    'p287g.h2': 'Participación en 287(g) por modelo',
    'p287g.desc': 'Conteo de agencias locales de Georgia bajo cada modelo 287(g). El modelo Task Force (TFM) fue reautorizado en 2025; permite aplicación a nivel de calle.',
    'p287g.notes_prefix': 'Fuentes:',
    'p287g.notes_src': 'lista del programa 287(g) de ICE',
    'p287g.notes_suffix': '; verificado contra anuncios de alguaciles y departamentos de policía municipal.',
    'surv.h2': 'Red de vigilancia · los 12 condados principales',
    'surv.desc': 'Puntuación compuesta del despliegue de lectores de placas (Flock), el intercambio de datos con APD, la conexión a FUSUS, y consultas documentadas de ICE a través de estas redes.',
    'surv.notes': 'Pesos de la red: Flock desplegado (1) + comparte con APD (1) + conectado a FUSUS (1) + consulta de ICE documentada (2). Tope 5.',
    'method.h2': '¿Qué determina la puntuación de un condado?',
    'method.desc': 'Metodología en lenguaje claro.',
    'method.row.287g': 'Estado 287(g)',
    'method.row.fb': '% nacidos fuera',
    'method.row.hisp': '% hispanos',
    'method.row.ice_infra': 'Infraestructura ICE',
    'method.row.hb1105': 'Base HB 1105',
    'method.row.arrests': 'Arrestos observados',
    'method.row.surv': 'Red de vigilancia',
    'method.notes': 'Niveles: Crítico ≥ 100; Alto 70 a 99; Medio 40 a 69; Bajo < 40. El modelo v3 añade arrestos observados y red de vigilancia sobre la base demográfica del v2. El modelo es direccional, no predictivo: un condado en nivel "Medio" no está a salvo; solo tiene menos de los indicadores que podemos rastrear desde fuentes públicas.',

    'tbl.summary_h': 'Todos los condados',
    'tbl.summary_sub': 'Busca, ordena, y haz clic en una fila para cargarla arriba.',
    'tbl.pill': '{n} condados',
    'tbl.search.placeholder': 'Buscar condados...',
    'tbl.search.aria': 'Buscar condados',
    'tbl.filter.tier.aria': 'Filtrar por nivel de riesgo',
    'tbl.filter.tier.all': 'Todos los niveles',
    'tbl.filter.tier.critical': 'Solo Crítico',
    'tbl.filter.tier.high': 'Solo Alto',
    'tbl.filter.tier.medium': 'Solo Medio',
    'tbl.filter.tier.low': 'Solo Bajo',
    'tbl.filter.287g.aria': 'Filtrar por 287(g)',
    'tbl.filter.287g.all': 'Todos 287(g)',
    'tbl.filter.287g.active': '287(g) activo',
    'tbl.filter.287g.inactive': 'Sin 287(g)',
    'tbl.filter.region.aria': 'Filtrar por región',
    'tbl.filter.region.all': 'Todo Georgia',
    'tbl.filter.region.metro': 'Área metro de Atlanta',
    'tbl.filter.region.nonmetro': 'Fuera del metro de Atlanta',
    'tbl.col.county': 'Condado',
    'tbl.col.score': 'Puntos',
    'tbl.col.tier': 'Nivel',
    'tbl.col.287g': '287(g)',
    'tbl.col.flock': 'Flock',
    'tbl.col.fb': '% NF',
    'tbl.col.hisp': '% Hisp',
    'tbl.col.arrests': 'Arrestos',
    'tbl.col.mesh': 'Red',
    'tbl.notes.demographics': 'Demografía:',
    'tbl.notes.census': 'ACS de 5 años del Censo de EE.UU., 2018 a 2022',
    'tbl.notes.middle': '. 287(g): lista del programa de ICE. Vigilancia:',
    'tbl.notes.flock_link': 'Flock Safety',
    'tbl.notes.end': 'registros de despliegue verificados contra EFF y reportes locales. Arrestos observados: reportes de incidentes agregados por la coalición.',

    'tier.critical': 'Crítico',
    'tier.high': 'Alto',
    'tier.medium': 'Medio',
    'tier.low': 'Bajo',

    'detail.county_suffix': 'Condado',
    'detail.fips': 'FIPS',
    'detail.metro': 'Área metro de Atlanta',
    'detail.nonmetro': 'Fuera del metro de Atlanta',
    'detail.pop': 'pob.',
    'detail.stat.fb': 'Nacidos en el extranjero',
    'detail.stat.hisp': 'Hispanos',
    'detail.stat.287g': 'Estado 287(g)',
    'detail.stat.hb1105': 'HB 1105',
    'detail.stat.cameras': 'Cámaras ALPR',
    'detail.stat.cam_per_100k': 'Cámaras por 100 mil',
    'detail.stat.not_participating': 'No participa',
    'detail.287g_agencies': 'Agencias 287(g):',
    'detail.ice_infra': 'Infraestructura ICE:',
    'detail.score_breakdown': 'Desglose de la puntuación',
    'detail.score.287g': '287(g)',
    'detail.score.fb': 'Nacidos fuera',
    'detail.score.hisp': '% Hispanos',
    'detail.score.ice_infra': 'Infra. ICE',
    'detail.score.hb1105': 'Base HB 1105',
    'detail.score.surv': 'Vigilancia',
    'detail.score.arrests': 'Arrestos observados',
    'detail.tags.287g_count': '{n} × 287(g)',
    'detail.tags.alpr_cameras': '{n} cámaras ALPR',
    'detail.tags.ice_query': 'Consulta de ICE documentada',
    'detail.tags.shares_apd': 'Comparte con APD',
    'detail.tags.fusus': 'Conectado a FUSUS',
    'detail.tags.arrests': '{n} arrestos observados',
    'detail.tags.none': 'Sin indicadores rastreados',
    'detail.flock_agencies': 'Agencias Flock:',
    'detail.surv_flags': 'Señales de vigilancia:',
    'detail.flock_count': 'Flock',
    'detail.other_alpr': 'Otras ALPR',
    'detail.interstates': 'Autopistas interestatales',
    'detail.cities_towns': 'Ciudades y pueblos',
    'detail.zoom.h4': 'Condado de {county}: huella de cámaras',
    'detail.zoom.stat': '<strong>{cams}</strong> cámaras; <strong>{per}</strong> por 100 mil',
    'detail.zoom.aria': 'Posiciones de cámaras del condado de {county}',

    'tip.score': 'puntos',
    'tip.no_287g': 'sin 287(g)',

    'p287g.bar.none': 'Sin 287(g)',

    'footer.line1.strong': 'Análisis independiente por Rosario Palacios.',
    'footer.line1.rest': 'Esta página combina registros públicos en una puntuación de riesgo comparable para la planificación de la coalición. Los datos estratégicos y de personal (contactos de alguaciles, listas de observadores, disparadores de abogados) se excluyen intencionalmente de esta vista.',
    'footer.contact': 'Preguntas, correcciones, o actualizaciones de datos:',
    'footer.build': 'modelo v3 · build',
    'footer.audience': 'Hecho para socios de coalición #AbolirICE. No para distribución a prensa pública.',
    'footer.cameras_credit_prefix': 'Ubicaciones de cámaras ©',
    'footer.cameras_osm': 'colaboradores de OpenStreetMap',
    'footer.cameras_credit_mid': '; agregadas por',
    'footer.cameras_deflock': 'DeFlock',

    'banner.strong': '¿De otro estado?',
    'banner.body': 'Si organizas con #AbolirICE o una coalición que trabaja en derechos de las personas inmigrantes, acceso al voto, o derechos civiles, puedo colaborar contigo para investigar y construir un tablero de riesgo a nivel de condado para tu estado.',
    'banner.cta': 'Empecemos a conversar',

    'modal.signup.h3': 'Un momentito antes de seguir explorando',
    'modal.signup.p': 'Este tablero es un análisis independiente. Si quieres recibir actualizaciones ocasionales cuando se añadan datos nuevos, deja tu correo; cualquiera que sea tu elección, el tablero sigue abierto.',
    'modal.signup.skip': 'Saltar por ahora',
    'modal.signup.frame_title': 'Mantente al tanto',
    'modal.partnership.h3': 'Construyamos esto para tu estado',
    'modal.partnership.p': 'Cuéntame del estado que quieres evaluar y del problema que estás tratando de resolver. Me pongo en contacto en unos días.',
    'modal.partnership.frame_title': 'Construir esto para tu estado',
    'modal.close.aria': 'Cerrar',
  },

  vi: {
    'doc.title': 'Bảng điều khiển rủi ro theo quận Georgia · Phân tích độc lập của Rosario Palacios',
    'doc.description': 'Phân tích độc lập của Rosario Palacios theo dõi rủi ro thực thi nhập cư ở cấp quận trên toàn bang Georgia: các thỏa thuận 287(g), hạ tầng giám sát, dữ liệu nhân khẩu, và các vụ bắt giữ được ghi nhận.',

    'header.brand': 'Bảng rủi ro các quận GA',
    'header.sub': 'Phân tích độc lập của Rosario Palacios',
    'header.cta.pill': 'Muốn một bản cho tiểu bang của bạn?',
    'header.darkmode.aria': 'Bật/tắt chế độ tối',
    'header.lang.aria': 'Đổi ngôn ngữ',

    'hero.h1': 'Theo dõi rủi ro thực thi nhập cư trên toàn bộ 159 quận của Georgia.',
    'hero.lede': 'Được xây dựng cho các nhà hoạt động và tổ chức tin rằng chúng ta nên #XóaBỏICE. Bảng này kết hợp các thỏa thuận công khai 287(g), mạng lưới camera đọc biển số (Flock), dữ liệu nhân khẩu, lập trường thực thi luật HB 1105, và hoạt động thực thi được ghi nhận, thành một điểm rủi ro có thể so sánh cho từng quận của Georgia. Hãy dùng nó để ưu tiên nơi cử quan sát viên pháp lý, nơi đặt năng lực đường dây nóng, và nơi triển khai tình nguyện viên phản ứng nhanh.',
    'hero.meta.model': 'mô hình rủi ro v3 · tháng 5/2026',
    'hero.meta.counties': '159 quận',
    'hero.meta.updated': 'Cập nhật hàng quý',
    'hero.meta.share': 'Chỉ chia sẻ trong liên minh',

    'kpi.counties_tracked': 'Số quận theo dõi',
    'kpi.counties_tracked.sub': 'Tất cả các quận của Georgia',
    'kpi.critical_high': 'Mức Nghiêm trọng · Cao',
    'kpi.critical_high.sub': '{critical} Nghiêm trọng · {high} Cao',
    'kpi.critical_high.donut_lab': 'tổng số quận',
    'kpi.287g': 'Thỏa thuận 287(g)',
    'kpi.287g.sub': 'Quan hệ hợp tác với cơ quan địa phương đang hoạt động',
    'kpi.cameras': 'Camera ALPR đã lập bản đồ',
    'kpi.cameras.sub': '{flock} Flock đã xác nhận; {counties} quận',
    'kpi.cameras.flock': 'Flock',
    'kpi.cameras.other': 'ALPR khác',
    'kpi.fb': 'Cư dân sinh ở nước ngoài',
    'kpi.fb.sub': 'Trên toàn bang',
    'kpi.arrests': 'Vụ bắt giữ được ghi nhận',
    'kpi.arrests.sub': 'Tại {n} quận; tổng hợp bởi liên minh',

    'map.h2': 'Bản đồ rủi ro · nhấp vào bất kỳ quận nào',
    'map.desc': 'Các quận được tô màu theo điểm rủi ro tổng hợp (v3). Điểm số kết hợp mức tham gia 287(g), tỷ lệ dân nhập cư, mức độ gần hạ tầng ICE, các vụ bắt giữ được ghi nhận, và mật độ mạng lưới giám sát.',
    'map.mode.risk': 'Mức rủi ro',
    'map.mode.287g': '287(g)',
    'map.mode.flock': 'Flock',
    'map.mode.cameras': 'Camera',
    'map.mode.fb': '% sinh ở nước ngoài',
    'map.cameras.toggle': 'Hiện camera',
    'map.empty': 'Nhấp vào một quận trên bản đồ (hoặc chọn từ bảng phía dưới) để xem hồ sơ rủi ro, nhân khẩu, mức tham gia 287(g), và dấu vết giám sát.',

    'legend.multiple_agencies': 'Nhiều cơ quan',
    'legend.one_agency': 'Một cơ quan',
    'legend.no_287g': 'Không có 287(g)',
    'legend.ice_query': 'Truy vấn ICE được ghi nhận',
    'legend.shares_apd': 'Chia sẻ với APD hoặc FUSUS',
    'legend.has_flock': 'Có Flock',
    'legend.no_flock': 'Không có Flock',
    'legend.fewer_cameras': 'Ít camera hơn',
    'legend.more_cameras': 'Nhiều camera hơn (thang log)',
    'legend.lower_pct': '% thấp hơn',
    'legend.higher_pct': '% cao hơn',
    'legend.risk.critical': 'Nghiêm trọng (100+)',
    'legend.risk.high': 'Cao (70 đến 99)',
    'legend.risk.medium': 'Trung bình (40 đến 69)',
    'legend.risk.low': 'Thấp (< 40)',

    'tier.h2': 'Phân bố theo mức rủi ro',
    'tier.desc': 'Các quận xếp như thế nào trên bốn mức rủi ro, kèm tỷ lệ dân sinh ở nước ngoài và các vụ bắt giữ được ghi nhận.',
    'tier.notes': 'Các quận mức Nghiêm trọng và Cao chứa một tỷ lệ không tương xứng dân nhập cư của Georgia. Hãy hướng năng lực quan sát viên pháp lý và đường dây nóng đến đây trước.',
    'tier.fb_share': 'Tỷ lệ sinh ở nước ngoài theo mức',
    'tier.arrests_by_tier': 'Vụ bắt giữ ghi nhận theo mức',
    'p287g.h2': 'Tham gia 287(g) theo mô hình',
    'p287g.desc': 'Số lượng cơ quan địa phương ở GA theo từng mô hình 287(g). Mô hình Task Force (TFM) được tái cấp phép năm 2025; cho phép thực thi ở cấp đường phố.',
    'p287g.notes_prefix': 'Nguồn:',
    'p287g.notes_src': 'danh sách chương trình 287(g) của ICE',
    'p287g.notes_suffix': '; đối chiếu với thông báo của cảnh sát trưởng quận và cảnh sát thành phố.',
    'surv.h2': 'Mạng lưới giám sát · 12 quận hàng đầu',
    'surv.desc': 'Điểm tổng hợp của việc triển khai camera đọc biển số (Flock), chia sẻ dữ liệu với APD, kết nối FUSUS, và các truy vấn ICE được ghi nhận qua các mạng lưới này.',
    'surv.notes': 'Trọng số điểm mạng lưới: triển khai Flock (1) + chia sẻ với APD (1) + kết nối FUSUS (1) + truy vấn ICE được ghi nhận (2). Tối đa 5.',
    'method.h2': 'Điều gì quyết định điểm số của một quận',
    'method.desc': 'Phương pháp luận bằng ngôn ngữ dễ hiểu.',
    'method.row.287g': 'Tình trạng 287(g)',
    'method.row.fb': '% sinh ở nước ngoài',
    'method.row.hisp': '% gốc Hispanic',
    'method.row.ice_infra': 'Hạ tầng ICE',
    'method.row.hb1105': 'Nền HB 1105',
    'method.row.arrests': 'Vụ bắt giữ được ghi nhận',
    'method.row.surv': 'Mạng lưới giám sát',
    'method.notes': 'Các mức: Nghiêm trọng ≥ 100; Cao 70 đến 99; Trung bình 40 đến 69; Thấp < 40. Mô hình v3 bổ sung các vụ bắt giữ được ghi nhận và mạng lưới giám sát lên trên nền nhân khẩu của v2. Mô hình mang tính định hướng, không phải dự đoán: một quận chấm điểm "Trung bình" không có nghĩa là an toàn; chỉ là có ít chỉ báo hơn mà chúng tôi có thể theo dõi từ nguồn công khai.',

    'tbl.summary_h': 'Tất cả các quận',
    'tbl.summary_sub': 'Tìm kiếm, sắp xếp, và nhấp vào một hàng để tải lên phía trên.',
    'tbl.pill': '{n} quận',
    'tbl.search.placeholder': 'Tìm quận...',
    'tbl.search.aria': 'Tìm quận',
    'tbl.filter.tier.aria': 'Lọc theo mức rủi ro',
    'tbl.filter.tier.all': 'Tất cả các mức',
    'tbl.filter.tier.critical': 'Chỉ Nghiêm trọng',
    'tbl.filter.tier.high': 'Chỉ Cao',
    'tbl.filter.tier.medium': 'Chỉ Trung bình',
    'tbl.filter.tier.low': 'Chỉ Thấp',
    'tbl.filter.287g.aria': 'Lọc theo 287(g)',
    'tbl.filter.287g.all': 'Tất cả 287(g)',
    'tbl.filter.287g.active': '287(g) đang hoạt động',
    'tbl.filter.287g.inactive': 'Không có 287(g)',
    'tbl.filter.region.aria': 'Lọc theo vùng',
    'tbl.filter.region.all': 'Toàn Georgia',
    'tbl.filter.region.metro': 'Khu metro Atlanta',
    'tbl.filter.region.nonmetro': 'Ngoài khu metro Atlanta',
    'tbl.col.county': 'Quận',
    'tbl.col.score': 'Điểm',
    'tbl.col.tier': 'Mức',
    'tbl.col.287g': '287(g)',
    'tbl.col.flock': 'Flock',
    'tbl.col.fb': '% NN',
    'tbl.col.hisp': '% Hisp',
    'tbl.col.arrests': 'Bắt giữ',
    'tbl.col.mesh': 'Mạng',
    'tbl.notes.demographics': 'Nhân khẩu:',
    'tbl.notes.census': 'ACS 5 năm của Cục Thống kê Hoa Kỳ, 2018 đến 2022',
    'tbl.notes.middle': '. 287(g): danh sách chương trình ICE. Giám sát:',
    'tbl.notes.flock_link': 'Flock Safety',
    'tbl.notes.end': 'hồ sơ triển khai được đối chiếu với EFF và báo chí địa phương. Vụ bắt giữ được ghi nhận: báo cáo sự việc tổng hợp bởi liên minh.',

    'tier.critical': 'Nghiêm trọng',
    'tier.high': 'Cao',
    'tier.medium': 'Trung bình',
    'tier.low': 'Thấp',

    'detail.county_suffix': 'Quận',
    'detail.fips': 'FIPS',
    'detail.metro': 'Khu metro Atlanta',
    'detail.nonmetro': 'Ngoài khu metro Atlanta',
    'detail.pop': 'dân số',
    'detail.stat.fb': 'Sinh ở nước ngoài',
    'detail.stat.hisp': 'Hispanic',
    'detail.stat.287g': 'Tình trạng 287(g)',
    'detail.stat.hb1105': 'HB 1105',
    'detail.stat.cameras': 'Camera ALPR',
    'detail.stat.cam_per_100k': 'Camera trên 100 nghìn dân',
    'detail.stat.not_participating': 'Không tham gia',
    'detail.287g_agencies': 'Các cơ quan 287(g):',
    'detail.ice_infra': 'Hạ tầng ICE:',
    'detail.score_breakdown': 'Chi tiết điểm số',
    'detail.score.287g': '287(g)',
    'detail.score.fb': 'Sinh ở nước ngoài',
    'detail.score.hisp': '% Hispanic',
    'detail.score.ice_infra': 'Hạ tầng ICE',
    'detail.score.hb1105': 'Nền HB 1105',
    'detail.score.surv': 'Giám sát',
    'detail.score.arrests': 'Vụ bắt giữ được ghi nhận',
    'detail.tags.287g_count': '{n} × 287(g)',
    'detail.tags.alpr_cameras': '{n} camera ALPR',
    'detail.tags.ice_query': 'Truy vấn ICE được ghi nhận',
    'detail.tags.shares_apd': 'Chia sẻ với APD',
    'detail.tags.fusus': 'Kết nối FUSUS',
    'detail.tags.arrests': '{n} vụ bắt giữ được ghi nhận',
    'detail.tags.none': 'Không có chỉ báo nào được theo dõi',
    'detail.flock_agencies': 'Cơ quan dùng Flock:',
    'detail.surv_flags': 'Dấu hiệu giám sát:',
    'detail.flock_count': 'Flock',
    'detail.other_alpr': 'ALPR khác',
    'detail.interstates': 'Cao tốc liên bang',
    'detail.cities_towns': 'Thành phố và thị trấn',
    'detail.zoom.h4': 'Quận {county}: dấu vết camera',
    'detail.zoom.stat': '<strong>{cams}</strong> camera; <strong>{per}</strong> trên 100 nghìn dân',
    'detail.zoom.aria': 'Vị trí camera của quận {county}',

    'tip.score': 'điểm',
    'tip.no_287g': 'không có 287(g)',

    'p287g.bar.none': 'Không có 287(g)',

    'footer.line1.strong': 'Phân tích độc lập của Rosario Palacios.',
    'footer.line1.rest': 'Trang này kết hợp các hồ sơ công khai thành một điểm rủi ro có thể so sánh, phục vụ việc lập kế hoạch cho liên minh. Dữ liệu chiến lược và nhân sự (liên hệ cảnh sát trưởng, danh sách quan sát viên, các tín hiệu kích hoạt luật sư) cố tình bị loại khỏi phần hiển thị này.',
    'footer.contact': 'Câu hỏi, đính chính, hoặc cập nhật dữ liệu:',
    'footer.build': 'mô hình v3 · build',
    'footer.audience': 'Được xây dựng cho các đối tác liên minh #XóaBỏICE. Không dành cho phân phối báo chí công khai.',
    'footer.cameras_credit_prefix': 'Vị trí camera ©',
    'footer.cameras_osm': 'cộng tác viên OpenStreetMap',
    'footer.cameras_credit_mid': '; tổng hợp bởi',
    'footer.cameras_deflock': 'DeFlock',

    'banner.strong': 'Bạn từ tiểu bang khác?',
    'banner.body': 'Nếu bạn là người tổ chức #XóaBỏICE hoặc thuộc một liên minh đang làm về quyền của người nhập cư, quyền tiếp cận lá phiếu, hoặc công việc dân quyền, tôi có thể đồng hành cùng bạn để nghiên cứu và xây dựng một bảng rủi ro ở cấp quận cho tiểu bang của bạn.',
    'banner.cta': 'Bắt đầu trò chuyện',

    'modal.signup.h3': 'Xin một phút trước khi bạn tiếp tục khám phá',
    'modal.signup.p': 'Bảng này là một phân tích độc lập. Nếu bạn muốn nhận cập nhật không thường xuyên khi có dữ liệu mới, hãy để lại email; dù bạn chọn thế nào, bảng vẫn mở.',
    'modal.signup.skip': 'Bỏ qua bây giờ',
    'modal.signup.frame_title': 'Cập nhật thông tin',
    'modal.partnership.h3': 'Xây dựng cho tiểu bang của bạn',
    'modal.partnership.p': 'Hãy kể cho tôi về tiểu bang bạn muốn đánh giá và vấn đề bạn đang cố gắng giải quyết. Tôi sẽ liên lạc trong vài ngày.',
    'modal.partnership.frame_title': 'Xây bảng cho tiểu bang của bạn',
    'modal.close.aria': 'Đóng',
  },
};

window.I18N_LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'es', label: 'ES', full: 'Español' },
  { code: 'vi', label: 'VI', full: 'Tiếng Việt' },
];

window.getLang = function () {
  try {
    const stored = localStorage.getItem('ga-dash-lang');
    if (stored && window.I18N[stored]) return stored;
  } catch (_) {}
  // Browser preference fallback
  const nav = (navigator.language || 'en').slice(0, 2);
  if (window.I18N[nav]) return nav;
  return 'en';
};

window.setLang = function (code) {
  if (!window.I18N[code]) return;
  try { localStorage.setItem('ga-dash-lang', code); } catch (_) {}
  document.documentElement.lang = code;
  window.applyI18N();
  // Re-render dynamic sections if the app has booted
  if (window.DATA && window.DATA.counties) {
    if (typeof renderKPIs === 'function') renderKPIs();
    if (typeof renderLegend === 'function') renderLegend();
    if (typeof drawLegend === 'function') drawLegend();
    if (typeof renderTierBars === 'function') renderTierBars();
    if (typeof render287gBars === 'function') render287gBars();
    if (typeof renderTable === 'function') renderTable();
    // If a county is currently selected, re-render the detail panel
    if (window.SELECTED_FIPS && window.DATA.byFips && window.DATA.byFips[window.SELECTED_FIPS]) {
      if (typeof renderDetail === 'function') renderDetail(window.DATA.byFips[window.SELECTED_FIPS]);
    }
    // Update the county count pill
    const pill = document.getElementById('county-count-pill');
    if (pill) pill.textContent = t('tbl.pill', { n: window.DATA.counties.length });
  }
};

window.t = function (key, vars) {
  const lang = window.getLang();
  const dict = window.I18N[lang] || window.I18N.en;
  let s = dict[key];
  if (s == null) s = window.I18N.en[key];
  if (s == null) return key;
  if (vars) {
    for (const k in vars) {
      s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    }
  }
  return s;
};

window.applyI18N = function () {
  const lang = window.getLang();
  document.documentElement.lang = lang;
  // Text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const html = el.dataset.i18nHtml === 'true';
    const value = window.t(key);
    if (html) el.innerHTML = value;
    else el.textContent = value;
  });
  // Attribute replacements: data-i18n-attr="placeholder:tbl.search.placeholder,aria-label:tbl.search.aria"
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, window.t(key));
    });
  });
  // Document title + meta description
  if (window.I18N[lang]) {
    document.title = window.t('doc.title');
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', window.t('doc.description'));
  }
  // Update active state on language buttons
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.classList.toggle('active', b.dataset.langBtn === lang);
  });
};

// Boot: apply translations on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.applyI18N());
} else {
  window.applyI18N();
}
