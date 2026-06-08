/**
 * Diccionario de traducciones para el HOME.
 *
 * Cobertura: solo el home en esta primera pasada. Para añadir nuevas
 * paginas al sistema i18n, añadir keys aqui y cubrir los 4 idiomas.
 *
 * El locale "es" es la fuente de verdad — si una key falta en otro locale,
 * cae a "es" como fallback (ver useLocale.t()).
 */

export type Locale = "es" | "en" | "fr" | "pt";

export const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
];

export type TranslationKey =
  // ── HOME ──
  | "home.hero.title.line1"
  | "home.hero.title.line2"
  | "home.hero.title.highlight"
  | "home.hero.subtitle"
  | "home.hero.cta"
  | "home.hero.cta2"
  | "home.hero.featured"
  | "home.search.placeholder"
  | "home.search.filters"
  | "home.audience.label"
  | "home.popular.title"
  | "home.popular.viewAll"
  | "home.popular.empty"
  | "home.popular.use"
  | "home.steps.choose"
  | "home.steps.choose.sub"
  | "home.steps.customize"
  | "home.steps.customize.sub"
  | "home.steps.download"
  | "home.steps.download.sub"
  | "home.howItWorks.title"
  | "home.features.fast"
  | "home.features.fast.sub"
  | "home.features.pro"
  | "home.features.pro.sub"
  | "home.features.ready"
  | "home.features.ready.sub"
  | "home.features.support"
  | "home.features.support.sub"
  // ── FILTROS COMUNES ──
  | "categories.all"
  | "categories.party"
  | "categories.concert"
  | "categories.classes"
  | "categories.festival"
  | "categories.club"
  | "formats.all"
  | "formats.igPost"
  | "formats.igStory"
  | "formats.igSquare"
  | "formats.fbCover"
  | "audience.all"
  | "audience.producers"
  | "audience.academies"
  | "audience.freelance"
  | "audience.institutions"
  | "audience.agencies"
  | "audience.schools"
  // ── NAVEGACION (AppShell header + bottom nav + drawer) ──
  | "nav.create"
  | "nav.templates"
  | "nav.projects"
  | "nav.collaborators"
  | "nav.history"
  | "nav.admin"
  | "nav.flyersShort"
  | "nav.teamShort"
  | "nav.more"
  | "nav.notifications"
  | "nav.credits"
  | "nav.plan.free"
  | "nav.plan.pro"
  | "nav.signOut"
  | "nav.signIn"
  | "nav.signUp"
  | "nav.signUpShort"
  // ── AUTH MODAL ──
  | "auth.title.login"
  | "auth.title.register"
  | "auth.subtitle.login"
  | "auth.subtitle.register"
  | "auth.google"
  | "auth.divider"
  | "auth.placeholder.name"
  | "auth.placeholder.email"
  | "auth.placeholder.password"
  | "auth.button.login"
  | "auth.button.register"
  | "auth.button.loading"
  | "auth.success.created"
  | "auth.error.generic"
  | "auth.error.terms"
  | "auth.terms.iAccept"
  | "auth.terms.linkTerms"
  | "auth.terms.and"
  | "auth.terms.linkPrivacy"
  | "auth.terms.byLogin"
  | "auth.switch.noAccount"
  | "auth.switch.hasAccount"
  | "auth.switch.registerAction"
  | "auth.switch.loginAction"
  | "auth.gate.title"
  | "auth.gate.subtitle"
  // ── FOOTER ──
  | "footer.privacy"
  | "footer.terms"
  | "footer.cookies"
  | "footer.beta"
  // ── A11y / Tooltips compartidos ──
  | "a11y.themeToggle.toLight"
  | "a11y.themeToggle.toDark"
  | "a11y.themeToggle.titleLight"
  | "a11y.themeToggle.titleDark"
  | "a11y.locale.label"
  // ── /templates (catalogo publico) ──
  | "templates.title"
  | "templates.subtitle.all"
  | "templates.subtitle.explore"
  | "templates.sidebar.filters"
  | "templates.sidebar.categories"
  | "templates.sidebar.audience"
  | "templates.sidebar.clear"
  | "templates.sidebar.clearAll"
  | "templates.sidebar.clearAllAria"
  | "templates.sidebar.closeAria"
  | "templates.cat.classesDance"
  | "templates.cat.clubDisco"
  | "templates.cat.corporate"
  | "templates.cat.concerts"
  | "templates.sort.recent"
  | "templates.sort.popular"
  | "templates.sort.premiumFirst"
  | "templates.empty.title"
  | "templates.empty.sub"
  | "templates.empty.cta"
  | "templates.use"
  | "templates.useAria"
  | "templates.scrollTop"
  | "templates.filter.premium"
  | "templates.modal.title"
  | "templates.modal.subtitle"
  | "templates.modal.use"
  // ── /templates v2 (rediseño completo mockup) ──
  | "templates.greeting"
  | "templates.greetingFallback"
  | "templates.tagline"
  | "templates.createFlyer"
  | "templates.searchAll"
  | "templates.publishIn"
  | "templates.publishIn.sub"
  | "templates.publish.igFeed"
  | "templates.publish.igStory"
  | "templates.publish.tiktok"
  | "templates.publish.facebook"
  | "templates.publish.whatsapp"
  | "templates.publish.linkedin"
  | "templates.publish.youtube"
  | "templates.publish.custom"
  | "templates.publish.custom.sub"
  | "templates.useCase.title"
  | "templates.useCase.sub"
  | "templates.useCase.promote"
  | "templates.useCase.sellTickets"
  | "templates.useCase.launch"
  | "templates.useCase.attractStudents"
  | "templates.useCase.announceArtist"
  | "templates.useCase.more"
  | "templates.grid.title"
  | "templates.grid.count"
  | "templates.grid.sort"
  | "templates.grid.loadMore"
  | "templates.nav.title"
  | "templates.nav.home"
  | "templates.nav.favorites"
  | "templates.cat.moreCategories"
  | "templates.proCard.title"
  | "templates.proCard.body"
  | "templates.proCard.cta"
  | "templates.quickActions.title"
  | "templates.quickActions.customSize"
  | "templates.quickActions.uploadImage"
  | "templates.quickActions.myResources"
  | "templates.quickActions.myColors"
  | "templates.quickActions.myFonts"
  | "templates.aiCard.tag"
  | "templates.aiCard.title"
  | "templates.aiCard.body"
  | "templates.notifications"
  // ── Paginas legales (cabecera y fallback de traduccion) ──
  | "legal.lastUpdated"
  | "legal.translationPending.title"
  | "legal.translationPending.body"
  | "legal.translationPending.cta"
  | "legal.privacy.title"
  | "legal.privacy.desc"
  | "legal.terms.title"
  | "legal.terms.desc"
  | "legal.cookies.title"
  | "legal.cookies.desc";

type Dict = Record<TranslationKey, string>;

const es: Dict = {
  "home.hero.title.line1": "Plantillas listas",
  "home.hero.title.line2": "para",
  "home.hero.title.highlight": "tu evento",
  "home.hero.subtitle": "Elige un diseño, personalízalo y descárgalo en alta calidad.",
  "home.hero.cta": "Explorar plantillas",
  "home.hero.cta2": "Ver categorías",
  "home.hero.featured": "DESTACADA",
  "home.search.placeholder": "Buscar plantillas...",
  "home.search.filters": "Filtros",
  "home.audience.label": "Para quién",
  "home.popular.title": "Favoritas y nuevas",
  "home.popular.viewAll": "Ver todas",
  "home.popular.empty": "No hay plantillas que coincidan con esos filtros.",
  "home.popular.use": "Usar",
  "home.howItWorks.title": "¿Cómo funciona?",
  "home.steps.choose": "Elige plantilla",
  "home.steps.choose.sub": "Explora y selecciona el diseño ideal.",
  "home.steps.customize": "Personaliza",
  "home.steps.customize.sub": "Edita textos, fotos y colores.",
  "home.steps.download": "Descarga",
  "home.steps.download.sub": "PNG listo para publicar al instante.",
  "home.features.fast": "Entrega rápida",
  "home.features.fast.sub": "Tu flyer en segundos, no en días.",
  "home.features.pro": "Diseños profesionales",
  "home.features.pro.sub": "Plantillas pulidas por diseñadores.",
  "home.features.ready": "Listo para redes",
  "home.features.ready.sub": "Formatos optimizados para Instagram, FB.",
  "home.features.support": "Atención cercana",
  "home.features.support.sub": "Te acompañamos en el proceso.",
  "categories.all": "Todas",
  "categories.party": "Fiesta",
  "categories.concert": "Concierto",
  "categories.classes": "Clases",
  "categories.festival": "Festival",
  "categories.club": "Discoteca",
  "formats.all": "Todos",
  "formats.igPost": "IG Post",
  "formats.igStory": "IG Historia",
  "formats.igSquare": "IG Cuadrado",
  "formats.fbCover": "FB Portada",
  "audience.all": "Todos",
  "audience.producers": "Productoras",
  "audience.academies": "Academias",
  "audience.freelance": "Freelance",
  "audience.institutions": "Instituciones",
  "audience.agencies": "Agencias",
  "audience.schools": "Colegios",
  // Nav
  "nav.create": "Crear",
  "nav.templates": "Plantillas",
  "nav.projects": "Mis flyers",
  "nav.collaborators": "Colaboradores",
  "nav.history": "Historial",
  "nav.admin": "Admin",
  "nav.flyersShort": "Flyers",
  "nav.teamShort": "Equipo",
  "nav.more": "Más",
  "nav.notifications": "Notificaciones",
  "nav.credits": "Créditos",
  "nav.plan.free": "Free",
  "nav.plan.pro": "PRO",
  "nav.signOut": "Cerrar sesión",
  "nav.signIn": "Iniciar sesión",
  "nav.signUp": "Regístrate gratis",
  "nav.signUpShort": "Entrar",
  // Auth
  "auth.title.login": "Iniciar sesión",
  "auth.title.register": "Crear cuenta",
  "auth.subtitle.login": "Bienvenido de vuelta",
  "auth.subtitle.register": "Empieza gratis con 20 créditos",
  "auth.google": "Continuar con Google",
  "auth.divider": "o con email",
  "auth.placeholder.name": "Tu nombre",
  "auth.placeholder.email": "Email",
  "auth.placeholder.password": "Contraseña",
  "auth.button.login": "Iniciar sesión",
  "auth.button.register": "Crear cuenta gratis",
  "auth.button.loading": "Cargando...",
  "auth.success.created": "¡Cuenta creada! Revisa tu email para confirmar.",
  "auth.error.generic": "Error al autenticar",
  "auth.error.terms": "Debes aceptar los términos y la política de privacidad para registrarte.",
  "auth.terms.iAccept": "He leído y acepto los",
  "auth.terms.linkTerms": "Términos",
  "auth.terms.and": "y la",
  "auth.terms.linkPrivacy": "Política de Privacidad",
  "auth.terms.byLogin": "Al iniciar sesión aceptas nuestros",
  "auth.switch.noAccount": "¿No tienes cuenta?",
  "auth.switch.hasAccount": "¿Ya tienes cuenta?",
  "auth.switch.registerAction": "Regístrate gratis",
  "auth.switch.loginAction": "Inicia sesión",
  "auth.gate.title": "Descarga tu diseño",
  "auth.gate.subtitle": "Inicia sesión para descargar. Es gratis.",
  // Footer
  "footer.privacy": "Privacidad",
  "footer.terms": "Términos",
  "footer.cookies": "Cookies",
  "footer.beta": "BETA",
  // A11y
  "a11y.themeToggle.toLight": "Cambiar a tema claro",
  "a11y.themeToggle.toDark": "Cambiar a tema oscuro",
  "a11y.themeToggle.titleLight": "Tema claro",
  "a11y.themeToggle.titleDark": "Tema oscuro",
  "a11y.locale.label": "Cambiar idioma",
  // /templates
  "templates.title": "Plantillas",
  "templates.subtitle.all": "Elige una plantilla lista para editar",
  "templates.subtitle.explore": "Explorando",
  "templates.sidebar.filters": "Filtros",
  "templates.sidebar.categories": "Categorías",
  "templates.sidebar.audience": "Para quién es",
  "templates.sidebar.clear": "Limpiar",
  "templates.sidebar.clearAll": "Borrar filtros",
  "templates.sidebar.clearAllAria": "Borrar todos los filtros",
  "templates.sidebar.closeAria": "Cerrar filtros",
  "templates.cat.classesDance": "Clases de baile",
  "templates.cat.clubDisco": "Club / Discoteca",
  "templates.cat.corporate": "Corporativo",
  "templates.cat.concerts": "Conciertos",
  "templates.sort.recent": "Más recientes",
  "templates.sort.popular": "Más populares",
  "templates.sort.premiumFirst": "Premium primero",
  "templates.empty.title": "No hay plantillas en este formato todavía",
  "templates.empty.sub": "Prueba con otro formato o quita algún filtro",
  "templates.empty.cta": "Limpiar filtros",
  "templates.use": "Usar plantilla",
  "templates.useAria": "Usar plantilla",
  "templates.scrollTop": "Volver arriba",
  "templates.filter.premium": "Premium",
  "templates.modal.title": "Elige formato",
  "templates.modal.subtitle": "Esta plantilla está disponible en varios formatos",
  "templates.modal.use": "Usar este formato",
  // /templates v2
  "templates.greeting": "¡Hola, {name}!",
  "templates.greetingFallback": "¡Hola!",
  "templates.tagline": "Encuentra la plantilla perfecta y crea flyers que destacan.",
  "templates.createFlyer": "Crear flyer",
  "templates.searchAll": "Buscar plantillas, eventos, marcas...",
  "templates.publishIn": "PUBLICAR EN",
  "templates.publishIn.sub": "Elige la red o formato",
  "templates.publish.igFeed": "Instagram Feed",
  "templates.publish.igStory": "Story / Reel",
  "templates.publish.tiktok": "TikTok",
  "templates.publish.facebook": "Facebook",
  "templates.publish.whatsapp": "Estados",
  "templates.publish.linkedin": "LinkedIn",
  "templates.publish.youtube": "YouTube",
  "templates.publish.custom": "Formato personalizado",
  "templates.publish.custom.sub": "Ancho x Alto",
  "templates.useCase.title": "¿PARA QUÉ LO NECESITAS?",
  "templates.useCase.sub": "Encuentra más rápido",
  "templates.useCase.promote": "Promocionar evento",
  "templates.useCase.sellTickets": "Vender entradas",
  "templates.useCase.launch": "Lanzamiento",
  "templates.useCase.attractStudents": "Captar alumnos",
  "templates.useCase.announceArtist": "Anunciar artista",
  "templates.useCase.more": "Más",
  "templates.grid.title": "Plantillas",
  "templates.grid.count": "{n} disponibles",
  "templates.grid.sort": "Ordenar por",
  "templates.grid.loadMore": "Cargar más plantillas",
  "templates.nav.title": "Navegación",
  "templates.nav.home": "Inicio",
  "templates.nav.favorites": "Favoritos",
  "templates.cat.moreCategories": "Más categorías",
  "templates.proCard.title": "PRO",
  "templates.proCard.body": "Desbloquea plantillas PRO, recursos y mucho más.",
  "templates.proCard.cta": "Ver planes",
  "templates.quickActions.title": "Acciones rápidas",
  "templates.quickActions.customSize": "Tamaño personalizado",
  "templates.quickActions.uploadImage": "Subir imagen",
  "templates.quickActions.myResources": "Mis recursos",
  "templates.quickActions.myColors": "Mis colores",
  "templates.quickActions.myFonts": "Mis fuentes",
  "templates.aiCard.tag": "Nuevo en Arte Gen",
  "templates.aiCard.title": "Genera ideas con IA",
  "templates.aiCard.body": "Describe tu evento y te sugerimos plantillas.",
  "templates.notifications": "Notificaciones",
  // Legales — cabecera + fallback
  "legal.lastUpdated": "Última actualización",
  "legal.translationPending.title": "Traducción pendiente",
  "legal.translationPending.body": "Esta versión todavía no está traducida. Por favor consulta la versión oficial en español.",
  "legal.translationPending.cta": "Ver versión en español",
  "legal.privacy.title": "Política de Privacidad",
  "legal.privacy.desc": "Cómo recogemos y tratamos tus datos personales en ArteGenIA.",
  "legal.terms.title": "Términos y Condiciones",
  "legal.terms.desc": "Reglas de uso del servicio ArteGenIA en fase beta.",
  "legal.cookies.title": "Política de Cookies",
  "legal.cookies.desc": "Cookies que usa ArteGenIA y cómo gestionarlas.",
};

const en: Dict = {
  "home.hero.title.line1": "Ready-made templates",
  "home.hero.title.line2": "for",
  "home.hero.title.highlight": "your event",
  "home.hero.subtitle": "Pick a design, customize it and download in high quality.",
  "home.hero.cta": "Explore templates",
  "home.hero.cta2": "View categories",
  "home.hero.featured": "FEATURED",
  "home.search.placeholder": "Search templates...",
  "home.search.filters": "Filters",
  "home.audience.label": "For who",
  "home.popular.title": "Favorites & new",
  "home.popular.viewAll": "View all",
  "home.popular.empty": "No templates match those filters.",
  "home.popular.use": "Use",
  "home.howItWorks.title": "How it works",
  "home.steps.choose": "Pick a template",
  "home.steps.choose.sub": "Browse and select the ideal design.",
  "home.steps.customize": "Customize",
  "home.steps.customize.sub": "Edit text, photos and colors.",
  "home.steps.download": "Download",
  "home.steps.download.sub": "PNG ready to post instantly.",
  "home.features.fast": "Fast delivery",
  "home.features.fast.sub": "Your flyer in seconds, not days.",
  "home.features.pro": "Professional design",
  "home.features.pro.sub": "Templates polished by designers.",
  "home.features.ready": "Ready for social",
  "home.features.ready.sub": "Formats optimized for Instagram, FB.",
  "home.features.support": "Close support",
  "home.features.support.sub": "We help you along the way.",
  "categories.all": "All",
  "categories.party": "Party",
  "categories.concert": "Concert",
  "categories.classes": "Classes",
  "categories.festival": "Festival",
  "categories.club": "Club",
  "formats.all": "All",
  "formats.igPost": "IG Post",
  "formats.igStory": "IG Story",
  "formats.igSquare": "IG Square",
  "formats.fbCover": "FB Cover",
  "audience.all": "All",
  "audience.producers": "Producers",
  "audience.academies": "Schools",
  "audience.freelance": "Freelance",
  "audience.institutions": "Institutions",
  "audience.agencies": "Agencies",
  "audience.schools": "K-12 Schools",
  // Nav
  "nav.create": "Create",
  "nav.templates": "Templates",
  "nav.projects": "My flyers",
  "nav.collaborators": "Collaborators",
  "nav.history": "History",
  "nav.admin": "Admin",
  "nav.flyersShort": "Flyers",
  "nav.teamShort": "Team",
  "nav.more": "More",
  "nav.notifications": "Notifications",
  "nav.credits": "Credits",
  "nav.plan.free": "Free",
  "nav.plan.pro": "PRO",
  "nav.signOut": "Sign out",
  "nav.signIn": "Sign in",
  "nav.signUp": "Sign up free",
  "nav.signUpShort": "Enter",
  // Auth
  "auth.title.login": "Sign in",
  "auth.title.register": "Create account",
  "auth.subtitle.login": "Welcome back",
  "auth.subtitle.register": "Start free with 20 credits",
  "auth.google": "Continue with Google",
  "auth.divider": "or with email",
  "auth.placeholder.name": "Your name",
  "auth.placeholder.email": "Email",
  "auth.placeholder.password": "Password",
  "auth.button.login": "Sign in",
  "auth.button.register": "Create free account",
  "auth.button.loading": "Loading...",
  "auth.success.created": "Account created! Check your email to confirm.",
  "auth.error.generic": "Authentication error",
  "auth.error.terms": "You must accept the terms and privacy policy to register.",
  "auth.terms.iAccept": "I have read and accept the",
  "auth.terms.linkTerms": "Terms",
  "auth.terms.and": "and",
  "auth.terms.linkPrivacy": "Privacy Policy",
  "auth.terms.byLogin": "By signing in you accept our",
  "auth.switch.noAccount": "Don't have an account?",
  "auth.switch.hasAccount": "Already have an account?",
  "auth.switch.registerAction": "Sign up free",
  "auth.switch.loginAction": "Sign in",
  "auth.gate.title": "Download your design",
  "auth.gate.subtitle": "Sign in to download. It's free.",
  // Footer
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.cookies": "Cookies",
  "footer.beta": "BETA",
  // A11y
  "a11y.themeToggle.toLight": "Switch to light theme",
  "a11y.themeToggle.toDark": "Switch to dark theme",
  "a11y.themeToggle.titleLight": "Light theme",
  "a11y.themeToggle.titleDark": "Dark theme",
  "a11y.locale.label": "Change language",
  // /templates
  "templates.title": "Templates",
  "templates.subtitle.all": "Pick a template ready to edit",
  "templates.subtitle.explore": "Exploring",
  "templates.sidebar.filters": "Filters",
  "templates.sidebar.categories": "Categories",
  "templates.sidebar.audience": "For who",
  "templates.sidebar.clear": "Clear",
  "templates.sidebar.clearAll": "Clear filters",
  "templates.sidebar.clearAllAria": "Clear all filters",
  "templates.sidebar.closeAria": "Close filters",
  "templates.cat.classesDance": "Dance classes",
  "templates.cat.clubDisco": "Club / Disco",
  "templates.cat.corporate": "Corporate",
  "templates.cat.concerts": "Concerts",
  "templates.sort.recent": "Most recent",
  "templates.sort.popular": "Most popular",
  "templates.sort.premiumFirst": "Premium first",
  "templates.empty.title": "No templates in this format yet",
  "templates.empty.sub": "Try another format or remove a filter",
  "templates.empty.cta": "Clear filters",
  "templates.use": "Use template",
  "templates.useAria": "Use template",
  "templates.scrollTop": "Back to top",
  "templates.filter.premium": "Premium",
  "templates.modal.title": "Pick a format",
  "templates.modal.subtitle": "This template is available in several formats",
  "templates.modal.use": "Use this format",
  // /templates v2
  "templates.greeting": "Hi, {name}!",
  "templates.greetingFallback": "Hi there!",
  "templates.tagline": "Find the perfect template and create flyers that stand out.",
  "templates.createFlyer": "Create flyer",
  "templates.searchAll": "Search templates, events, brands...",
  "templates.publishIn": "PUBLISH ON",
  "templates.publishIn.sub": "Pick a network or format",
  "templates.publish.igFeed": "Instagram Feed",
  "templates.publish.igStory": "Story / Reel",
  "templates.publish.tiktok": "TikTok",
  "templates.publish.facebook": "Facebook",
  "templates.publish.whatsapp": "Status",
  "templates.publish.linkedin": "LinkedIn",
  "templates.publish.youtube": "YouTube",
  "templates.publish.custom": "Custom format",
  "templates.publish.custom.sub": "Width x Height",
  "templates.useCase.title": "WHAT DO YOU NEED IT FOR?",
  "templates.useCase.sub": "Find it faster",
  "templates.useCase.promote": "Promote event",
  "templates.useCase.sellTickets": "Sell tickets",
  "templates.useCase.launch": "Launch",
  "templates.useCase.attractStudents": "Attract students",
  "templates.useCase.announceArtist": "Announce artist",
  "templates.useCase.more": "More",
  "templates.grid.title": "Templates",
  "templates.grid.count": "{n} available",
  "templates.grid.sort": "Sort by",
  "templates.grid.loadMore": "Load more templates",
  "templates.nav.title": "Navigation",
  "templates.nav.home": "Home",
  "templates.nav.favorites": "Favorites",
  "templates.cat.moreCategories": "More categories",
  "templates.proCard.title": "PRO",
  "templates.proCard.body": "Unlock PRO templates, resources and more.",
  "templates.proCard.cta": "View plans",
  "templates.quickActions.title": "Quick actions",
  "templates.quickActions.customSize": "Custom size",
  "templates.quickActions.uploadImage": "Upload image",
  "templates.quickActions.myResources": "My resources",
  "templates.quickActions.myColors": "My colors",
  "templates.quickActions.myFonts": "My fonts",
  "templates.aiCard.tag": "New in Arte Gen",
  "templates.aiCard.title": "Generate ideas with AI",
  "templates.aiCard.body": "Describe your event and we'll suggest templates.",
  "templates.notifications": "Notifications",
  // Legal
  "legal.lastUpdated": "Last updated",
  "legal.translationPending.title": "Translation pending",
  "legal.translationPending.body": "This version is not translated yet. Please read the official Spanish version.",
  "legal.translationPending.cta": "View Spanish version",
  "legal.privacy.title": "Privacy Policy",
  "legal.privacy.desc": "How we collect and process your personal data at ArteGenIA.",
  "legal.terms.title": "Terms and Conditions",
  "legal.terms.desc": "Rules of use for the ArteGenIA service in beta.",
  "legal.cookies.title": "Cookie Policy",
  "legal.cookies.desc": "Cookies used by ArteGenIA and how to manage them.",
};

const fr: Dict = {
  "home.hero.title.line1": "Modèles prêts",
  "home.hero.title.line2": "pour",
  "home.hero.title.highlight": "votre événement",
  "home.hero.subtitle": "Choisis un design, personnalise-le et télécharge-le en haute qualité.",
  "home.hero.cta": "Explorer les modèles",
  "home.hero.cta2": "Voir catégories",
  "home.hero.featured": "À LA UNE",
  "home.search.placeholder": "Rechercher des modèles...",
  "home.search.filters": "Filtres",
  "home.audience.label": "Pour qui",
  "home.popular.title": "Favoris & nouveautés",
  "home.popular.viewAll": "Voir tous",
  "home.popular.empty": "Aucun modèle ne correspond à ces filtres.",
  "home.popular.use": "Utiliser",
  "home.howItWorks.title": "Comment ça marche ?",
  "home.steps.choose": "Choisis un modèle",
  "home.steps.choose.sub": "Explore et sélectionne le design idéal.",
  "home.steps.customize": "Personnalise",
  "home.steps.customize.sub": "Modifie textes, photos et couleurs.",
  "home.steps.download": "Télécharge",
  "home.steps.download.sub": "PNG prêt à publier instantanément.",
  "home.features.fast": "Livraison rapide",
  "home.features.fast.sub": "Ton flyer en secondes, pas en jours.",
  "home.features.pro": "Design professionnel",
  "home.features.pro.sub": "Modèles peaufinés par des designers.",
  "home.features.ready": "Prêt pour les réseaux",
  "home.features.ready.sub": "Formats optimisés pour Instagram, FB.",
  "home.features.support": "Support proche",
  "home.features.support.sub": "On t'accompagne tout au long.",
  "categories.all": "Toutes",
  "categories.party": "Fête",
  "categories.concert": "Concert",
  "categories.classes": "Cours",
  "categories.festival": "Festival",
  "categories.club": "Discothèque",
  "formats.all": "Tous",
  "formats.igPost": "IG Post",
  "formats.igStory": "IG Story",
  "formats.igSquare": "IG Carré",
  "formats.fbCover": "FB Couverture",
  "audience.all": "Tous",
  "audience.producers": "Producteurs",
  "audience.academies": "Académies",
  "audience.freelance": "Freelance",
  "audience.institutions": "Institutions",
  "audience.agencies": "Agences",
  "audience.schools": "Écoles",
  // Nav
  "nav.create": "Créer",
  "nav.templates": "Modèles",
  "nav.projects": "Mes flyers",
  "nav.collaborators": "Collaborateurs",
  "nav.history": "Historique",
  "nav.admin": "Admin",
  "nav.flyersShort": "Flyers",
  "nav.teamShort": "Équipe",
  "nav.more": "Plus",
  "nav.notifications": "Notifications",
  "nav.credits": "Crédits",
  "nav.plan.free": "Free",
  "nav.plan.pro": "PRO",
  "nav.signOut": "Se déconnecter",
  "nav.signIn": "Se connecter",
  "nav.signUp": "S'inscrire gratuitement",
  "nav.signUpShort": "Entrer",
  // Auth
  "auth.title.login": "Se connecter",
  "auth.title.register": "Créer un compte",
  "auth.subtitle.login": "Bon retour",
  "auth.subtitle.register": "Commence gratuitement avec 20 crédits",
  "auth.google": "Continuer avec Google",
  "auth.divider": "ou avec email",
  "auth.placeholder.name": "Ton nom",
  "auth.placeholder.email": "Email",
  "auth.placeholder.password": "Mot de passe",
  "auth.button.login": "Se connecter",
  "auth.button.register": "Créer un compte gratuit",
  "auth.button.loading": "Chargement...",
  "auth.success.created": "Compte créé ! Vérifie ton email pour confirmer.",
  "auth.error.generic": "Erreur d'authentification",
  "auth.error.terms": "Tu dois accepter les conditions et la politique de confidentialité pour t'inscrire.",
  "auth.terms.iAccept": "J'ai lu et j'accepte les",
  "auth.terms.linkTerms": "Conditions",
  "auth.terms.and": "et la",
  "auth.terms.linkPrivacy": "Politique de confidentialité",
  "auth.terms.byLogin": "En te connectant tu acceptes nos",
  "auth.switch.noAccount": "Pas de compte ?",
  "auth.switch.hasAccount": "Déjà un compte ?",
  "auth.switch.registerAction": "Inscris-toi gratuitement",
  "auth.switch.loginAction": "Connecte-toi",
  "auth.gate.title": "Télécharge ton design",
  "auth.gate.subtitle": "Connecte-toi pour télécharger. C'est gratuit.",
  // Footer
  "footer.privacy": "Confidentialité",
  "footer.terms": "Conditions",
  "footer.cookies": "Cookies",
  "footer.beta": "BETA",
  // A11y
  "a11y.themeToggle.toLight": "Passer au thème clair",
  "a11y.themeToggle.toDark": "Passer au thème sombre",
  "a11y.themeToggle.titleLight": "Thème clair",
  "a11y.themeToggle.titleDark": "Thème sombre",
  "a11y.locale.label": "Changer de langue",
  // /templates
  "templates.title": "Modèles",
  "templates.subtitle.all": "Choisis un modèle prêt à éditer",
  "templates.subtitle.explore": "Exploration",
  "templates.sidebar.filters": "Filtres",
  "templates.sidebar.categories": "Catégories",
  "templates.sidebar.audience": "Pour qui",
  "templates.sidebar.clear": "Effacer",
  "templates.sidebar.clearAll": "Effacer les filtres",
  "templates.sidebar.clearAllAria": "Effacer tous les filtres",
  "templates.sidebar.closeAria": "Fermer les filtres",
  "templates.cat.classesDance": "Cours de danse",
  "templates.cat.clubDisco": "Club / Discothèque",
  "templates.cat.corporate": "Entreprise",
  "templates.cat.concerts": "Concerts",
  "templates.sort.recent": "Plus récents",
  "templates.sort.popular": "Plus populaires",
  "templates.sort.premiumFirst": "Premium d'abord",
  "templates.empty.title": "Aucun modèle dans ce format pour l'instant",
  "templates.empty.sub": "Essaie un autre format ou enlève un filtre",
  "templates.empty.cta": "Effacer les filtres",
  "templates.use": "Utiliser le modèle",
  "templates.useAria": "Utiliser le modèle",
  "templates.scrollTop": "Retour en haut",
  "templates.filter.premium": "Premium",
  "templates.modal.title": "Choisis un format",
  "templates.modal.subtitle": "Ce modèle est disponible en plusieurs formats",
  "templates.modal.use": "Utiliser ce format",
  // /templates v2
  "templates.greeting": "Salut, {name} !",
  "templates.greetingFallback": "Salut !",
  "templates.tagline": "Trouve le modèle parfait et crée des flyers qui se démarquent.",
  "templates.createFlyer": "Créer un flyer",
  "templates.searchAll": "Rechercher modèles, événements, marques...",
  "templates.publishIn": "PUBLIER SUR",
  "templates.publishIn.sub": "Choisis un réseau ou format",
  "templates.publish.igFeed": "Instagram Feed",
  "templates.publish.igStory": "Story / Reel",
  "templates.publish.tiktok": "TikTok",
  "templates.publish.facebook": "Facebook",
  "templates.publish.whatsapp": "Statut",
  "templates.publish.linkedin": "LinkedIn",
  "templates.publish.youtube": "YouTube",
  "templates.publish.custom": "Format personnalisé",
  "templates.publish.custom.sub": "Largeur x Hauteur",
  "templates.useCase.title": "POUR QUOI EN AS-TU BESOIN ?",
  "templates.useCase.sub": "Trouve plus vite",
  "templates.useCase.promote": "Promouvoir événement",
  "templates.useCase.sellTickets": "Vendre billets",
  "templates.useCase.launch": "Lancement",
  "templates.useCase.attractStudents": "Attirer élèves",
  "templates.useCase.announceArtist": "Annoncer artiste",
  "templates.useCase.more": "Plus",
  "templates.grid.title": "Modèles",
  "templates.grid.count": "{n} disponibles",
  "templates.grid.sort": "Trier par",
  "templates.grid.loadMore": "Charger plus de modèles",
  "templates.nav.title": "Navigation",
  "templates.nav.home": "Accueil",
  "templates.nav.favorites": "Favoris",
  "templates.cat.moreCategories": "Plus de catégories",
  "templates.proCard.title": "PRO",
  "templates.proCard.body": "Débloque les modèles PRO, ressources et plus.",
  "templates.proCard.cta": "Voir les plans",
  "templates.quickActions.title": "Actions rapides",
  "templates.quickActions.customSize": "Taille personnalisée",
  "templates.quickActions.uploadImage": "Importer image",
  "templates.quickActions.myResources": "Mes ressources",
  "templates.quickActions.myColors": "Mes couleurs",
  "templates.quickActions.myFonts": "Mes polices",
  "templates.aiCard.tag": "Nouveau sur Arte Gen",
  "templates.aiCard.title": "Génère des idées avec IA",
  "templates.aiCard.body": "Décris ton événement et on te suggère des modèles.",
  "templates.notifications": "Notifications",
  // Legal
  "legal.lastUpdated": "Dernière mise à jour",
  "legal.translationPending.title": "Traduction en attente",
  "legal.translationPending.body": "Cette version n'est pas encore traduite. Consulte la version officielle en espagnol.",
  "legal.translationPending.cta": "Voir la version en espagnol",
  "legal.privacy.title": "Politique de Confidentialité",
  "legal.privacy.desc": "Comment nous recueillons et traitons tes données personnelles chez ArteGenIA.",
  "legal.terms.title": "Conditions d'Utilisation",
  "legal.terms.desc": "Règles d'utilisation du service ArteGenIA en bêta.",
  "legal.cookies.title": "Politique de Cookies",
  "legal.cookies.desc": "Cookies utilisés par ArteGenIA et comment les gérer.",
};

const pt: Dict = {
  "home.hero.title.line1": "Modelos prontos",
  "home.hero.title.line2": "para",
  "home.hero.title.highlight": "o teu evento",
  "home.hero.subtitle": "Escolhe um design, personaliza-o e descarrega em alta qualidade.",
  "home.hero.cta": "Explorar modelos",
  "home.hero.cta2": "Ver categorias",
  "home.hero.featured": "DESTAQUE",
  "home.search.placeholder": "Pesquisar modelos...",
  "home.search.filters": "Filtros",
  "home.audience.label": "Para quem",
  "home.popular.title": "Favoritos e novos",
  "home.popular.viewAll": "Ver todos",
  "home.popular.empty": "Não há modelos que correspondam a esses filtros.",
  "home.popular.use": "Usar",
  "home.howItWorks.title": "Como funciona?",
  "home.steps.choose": "Escolhe modelo",
  "home.steps.choose.sub": "Explora e seleciona o design ideal.",
  "home.steps.customize": "Personaliza",
  "home.steps.customize.sub": "Edita textos, fotos e cores.",
  "home.steps.download": "Descarrega",
  "home.steps.download.sub": "PNG pronto para publicar.",
  "home.features.fast": "Entrega rápida",
  "home.features.fast.sub": "O teu flyer em segundos, não em dias.",
  "home.features.pro": "Design profissional",
  "home.features.pro.sub": "Modelos polidos por designers.",
  "home.features.ready": "Pronto para redes",
  "home.features.ready.sub": "Formatos otimizados para Instagram, FB.",
  "home.features.support": "Suporte próximo",
  "home.features.support.sub": "Acompanhamos-te no processo.",
  "categories.all": "Todas",
  "categories.party": "Festa",
  "categories.concert": "Concerto",
  "categories.classes": "Aulas",
  "categories.festival": "Festival",
  "categories.club": "Discoteca",
  "formats.all": "Todos",
  "formats.igPost": "IG Post",
  "formats.igStory": "IG Story",
  "formats.igSquare": "IG Quadrado",
  "formats.fbCover": "FB Capa",
  "audience.all": "Todos",
  "audience.producers": "Produtoras",
  "audience.academies": "Academias",
  "audience.freelance": "Freelance",
  "audience.institutions": "Instituições",
  "audience.agencies": "Agências",
  "audience.schools": "Escolas",
  // Nav
  "nav.create": "Criar",
  "nav.templates": "Modelos",
  "nav.projects": "Meus flyers",
  "nav.collaborators": "Colaboradores",
  "nav.history": "Histórico",
  "nav.admin": "Admin",
  "nav.flyersShort": "Flyers",
  "nav.teamShort": "Equipa",
  "nav.more": "Mais",
  "nav.notifications": "Notificações",
  "nav.credits": "Créditos",
  "nav.plan.free": "Free",
  "nav.plan.pro": "PRO",
  "nav.signOut": "Terminar sessão",
  "nav.signIn": "Iniciar sessão",
  "nav.signUp": "Regista-te grátis",
  "nav.signUpShort": "Entrar",
  // Auth
  "auth.title.login": "Iniciar sessão",
  "auth.title.register": "Criar conta",
  "auth.subtitle.login": "Bem-vindo de volta",
  "auth.subtitle.register": "Começa grátis com 20 créditos",
  "auth.google": "Continuar com Google",
  "auth.divider": "ou com email",
  "auth.placeholder.name": "O teu nome",
  "auth.placeholder.email": "Email",
  "auth.placeholder.password": "Palavra-passe",
  "auth.button.login": "Iniciar sessão",
  "auth.button.register": "Criar conta grátis",
  "auth.button.loading": "A carregar...",
  "auth.success.created": "Conta criada! Verifica o teu email para confirmar.",
  "auth.error.generic": "Erro de autenticação",
  "auth.error.terms": "Tens de aceitar os termos e a política de privacidade para te registares.",
  "auth.terms.iAccept": "Li e aceito os",
  "auth.terms.linkTerms": "Termos",
  "auth.terms.and": "e a",
  "auth.terms.linkPrivacy": "Política de Privacidade",
  "auth.terms.byLogin": "Ao iniciar sessão aceitas os nossos",
  "auth.switch.noAccount": "Não tens conta?",
  "auth.switch.hasAccount": "Já tens conta?",
  "auth.switch.registerAction": "Regista-te grátis",
  "auth.switch.loginAction": "Inicia sessão",
  "auth.gate.title": "Descarrega o teu design",
  "auth.gate.subtitle": "Inicia sessão para descarregar. É grátis.",
  // Footer
  "footer.privacy": "Privacidade",
  "footer.terms": "Termos",
  "footer.cookies": "Cookies",
  "footer.beta": "BETA",
  // A11y
  "a11y.themeToggle.toLight": "Mudar para tema claro",
  "a11y.themeToggle.toDark": "Mudar para tema escuro",
  "a11y.themeToggle.titleLight": "Tema claro",
  "a11y.themeToggle.titleDark": "Tema escuro",
  "a11y.locale.label": "Mudar idioma",
  // /templates
  "templates.title": "Modelos",
  "templates.subtitle.all": "Escolhe um modelo pronto a editar",
  "templates.subtitle.explore": "A explorar",
  "templates.sidebar.filters": "Filtros",
  "templates.sidebar.categories": "Categorias",
  "templates.sidebar.audience": "Para quem",
  "templates.sidebar.clear": "Limpar",
  "templates.sidebar.clearAll": "Apagar filtros",
  "templates.sidebar.clearAllAria": "Apagar todos os filtros",
  "templates.sidebar.closeAria": "Fechar filtros",
  "templates.cat.classesDance": "Aulas de dança",
  "templates.cat.clubDisco": "Club / Discoteca",
  "templates.cat.corporate": "Empresarial",
  "templates.cat.concerts": "Concertos",
  "templates.sort.recent": "Mais recentes",
  "templates.sort.popular": "Mais populares",
  "templates.sort.premiumFirst": "Premium primeiro",
  "templates.empty.title": "Ainda não há modelos neste formato",
  "templates.empty.sub": "Experimenta outro formato ou tira um filtro",
  "templates.empty.cta": "Limpar filtros",
  "templates.use": "Usar modelo",
  "templates.useAria": "Usar modelo",
  "templates.scrollTop": "Voltar ao topo",
  "templates.filter.premium": "Premium",
  "templates.modal.title": "Escolhe o formato",
  "templates.modal.subtitle": "Este modelo está disponível em vários formatos",
  "templates.modal.use": "Usar este formato",
  // /templates v2
  "templates.greeting": "Olá, {name}!",
  "templates.greetingFallback": "Olá!",
  "templates.tagline": "Encontra o modelo perfeito e cria flyers que se destacam.",
  "templates.createFlyer": "Criar flyer",
  "templates.searchAll": "Procurar modelos, eventos, marcas...",
  "templates.publishIn": "PUBLICAR EM",
  "templates.publishIn.sub": "Escolhe a rede ou formato",
  "templates.publish.igFeed": "Instagram Feed",
  "templates.publish.igStory": "Story / Reel",
  "templates.publish.tiktok": "TikTok",
  "templates.publish.facebook": "Facebook",
  "templates.publish.whatsapp": "Estados",
  "templates.publish.linkedin": "LinkedIn",
  "templates.publish.youtube": "YouTube",
  "templates.publish.custom": "Formato personalizado",
  "templates.publish.custom.sub": "Largura x Altura",
  "templates.useCase.title": "PARA QUE PRECISAS?",
  "templates.useCase.sub": "Encontra mais depressa",
  "templates.useCase.promote": "Promover evento",
  "templates.useCase.sellTickets": "Vender bilhetes",
  "templates.useCase.launch": "Lançamento",
  "templates.useCase.attractStudents": "Captar alunos",
  "templates.useCase.announceArtist": "Anunciar artista",
  "templates.useCase.more": "Mais",
  "templates.grid.title": "Modelos",
  "templates.grid.count": "{n} disponíveis",
  "templates.grid.sort": "Ordenar por",
  "templates.grid.loadMore": "Carregar mais modelos",
  "templates.nav.title": "Navegação",
  "templates.nav.home": "Início",
  "templates.nav.favorites": "Favoritos",
  "templates.cat.moreCategories": "Mais categorias",
  "templates.proCard.title": "PRO",
  "templates.proCard.body": "Desbloqueia modelos PRO, recursos e muito mais.",
  "templates.proCard.cta": "Ver planos",
  "templates.quickActions.title": "Ações rápidas",
  "templates.quickActions.customSize": "Tamanho personalizado",
  "templates.quickActions.uploadImage": "Carregar imagem",
  "templates.quickActions.myResources": "Os meus recursos",
  "templates.quickActions.myColors": "As minhas cores",
  "templates.quickActions.myFonts": "Os meus tipos",
  "templates.aiCard.tag": "Novo na Arte Gen",
  "templates.aiCard.title": "Gera ideias com IA",
  "templates.aiCard.body": "Descreve o teu evento e sugerimos modelos.",
  "templates.notifications": "Notificações",
  // Legal
  "legal.lastUpdated": "Última atualização",
  "legal.translationPending.title": "Tradução pendente",
  "legal.translationPending.body": "Esta versão ainda não está traduzida. Por favor consulta a versão oficial em espanhol.",
  "legal.translationPending.cta": "Ver versão em espanhol",
  "legal.privacy.title": "Política de Privacidade",
  "legal.privacy.desc": "Como recolhemos e tratamos os teus dados pessoais na ArteGenIA.",
  "legal.terms.title": "Termos e Condições",
  "legal.terms.desc": "Regras de utilização do serviço ArteGenIA em beta.",
  "legal.cookies.title": "Política de Cookies",
  "legal.cookies.desc": "Cookies usados pela ArteGenIA e como geri-los.",
};

export const TRANSLATIONS: Record<Locale, Dict> = { es, en, fr, pt };
