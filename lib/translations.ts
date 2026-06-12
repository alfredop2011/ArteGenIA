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
  | "legal.cookies.desc"
  // ── /projects ──
  | "projects.title"
  | "projects.subtitle.one"
  | "projects.subtitle.many"
  | "projects.newFlyer"
  | "projects.loginRequired.title"
  | "projects.loginRequired.body"
  | "projects.loginRequired.cta"
  | "projects.empty.title"
  | "projects.empty.body"
  | "projects.empty.cta"
  | "projects.card.editAria"
  | "projects.card.deleteAria"
  | "projects.card.edit"
  | "projects.confirmDelete"
  // ── /history ──
  | "history.title"
  | "history.body"
  // ── /colaboradores ──
  | "collab.title"
  | "collab.subtitle"
  | "collab.invite"
  | "collab.tab.people"
  | "collab.tab.brands"
  | "collab.search.people"
  | "collab.search.brands"
  | "collab.sort.recent"
  | "collab.sort.alpha"
  | "collab.sort.recentShort"
  | "collab.sort.alphaShort"
  | "collab.empty.noResults"
  | "collab.empty.people.title"
  | "collab.empty.brands.title"
  | "collab.empty.people.body"
  | "collab.empty.brands.body"
  | "collab.card.editBrand"
  | "collab.card.editRole"
  | "collab.card.askUpdate"
  | "collab.card.delete"
  | "collab.modal.editBrand.title"
  | "collab.modal.editRole.title"
  | "collab.modal.editBrand.body"
  | "collab.modal.editRole.body"
  | "collab.modal.name"
  | "collab.modal.role"
  | "collab.modal.optional"
  | "collab.modal.role.placeholderBrand"
  | "collab.modal.role.placeholderPerson"
  | "collab.modal.gdprNotice"
  | "collab.modal.saving"
  | "collab.modal.save"
  | "collab.invite.title"
  | "collab.invite.body"
  | "collab.invite.linkLabel"
  | "collab.invite.copied"
  | "collab.invite.copy"
  | "collab.invite.whatsapp"
  | "collab.invite.whatsappMessage"
  | "collab.reinvite.title"
  | "collab.reinvite.body"
  | "collab.reinvite.whatsappMessage"
  | "collab.delete.title"
  | "collab.delete.body"
  | "collab.delete.cancel"
  | "collab.delete.confirm"
  | "collab.delete.deleting"
  | "collab.error.load"
  | "collab.error.unknown"
  | "collab.error.invite"
  | "collab.error.save"
  | "collab.error.reinvite"
  | "collab.error.delete"
  // ── /admin/templates ──
  | "admin.tpl.title"
  | "admin.tpl.internal"
  | "admin.tpl.subtitle"
  | "admin.tpl.newTemplate"
  | "admin.tpl.discard"
  | "admin.tpl.viewChanges"
  | "admin.tpl.search.placeholder"
  | "admin.tpl.sort.newFirst"
  | "admin.tpl.sort.oldFirst"
  | "admin.tpl.filter.all"
  | "admin.tpl.filter.untagged"
  | "admin.tpl.empty"
  | "admin.tpl.modified"
  | "admin.tpl.variants"
  | "admin.tpl.premium"
  | "admin.tpl.internalTags"
  | "admin.tpl.pagination.showing"
  | "admin.tpl.pagination.of"
  | "admin.tpl.pagination.prev"
  | "admin.tpl.pagination.next"
  | "admin.tpl.diff.title.one"
  | "admin.tpl.diff.title.many"
  | "admin.tpl.diff.subtitle"
  | "admin.tpl.diff.noTags"
  | "admin.tpl.diff.warning"
  | "admin.tpl.diff.copy"
  | "admin.tpl.diff.copied"
  // ── /admin/templates/new ──
  | "admin.new.title"
  | "admin.new.subtitle"
  | "admin.new.create"
  | "admin.new.creating"
  | "admin.new.createShort"
  | "admin.new.tab.drafts"
  | "admin.new.tab.published"
  | "admin.new.drafts.empty.title"
  | "admin.new.drafts.empty.body"
  | "admin.new.published.empty.title"
  | "admin.new.published.empty.body"
  | "admin.new.draft.status.draft"
  | "admin.new.draft.status.ready"
  | "admin.new.draft.status.archived"
  | "admin.new.published.status"
  | "admin.new.card.delete"
  | "admin.new.card.unpublish"
  | "admin.new.card.edit"
  | "admin.new.confirm.delete"
  | "admin.new.confirm.unpublish"
  | "admin.new.error.editPublished"
  | "admin.new.firstTemplate.title"
  | "admin.new.firstTemplate.untitled"
  | "admin.new.firstTemplate.cat"
  // ── /create (Wizard IA) ──
  | "create.examples.0"
  | "create.examples.1"
  | "create.examples.2"
  | "create.examples.3"
  | "create.chips.0"
  | "create.chips.1"
  | "create.chips.2"
  | "create.chips.3"
  | "create.gen.title"
  | "create.gen.step.analyze"
  | "create.gen.step.bg"
  | "create.gen.step.artists"
  | "create.gen.step.preview"
  | "create.gen.label.analyze"
  | "create.gen.label.bg"
  | "create.gen.label.artists"
  | "create.gen.label.preview"
  | "create.gen.footnote"
  | "create.gen.error"
  | "create.gen.error.unknown"
  | "create.badge.soon"
  | "create.title.line1"
  | "create.title.highlight"
  | "create.sub.admin.lead"
  | "create.sub.admin.ai"
  | "create.sub.admin.tail"
  | "create.sub.guest.lead"
  | "create.sub.guest.link"
  | "create.sub.guest.tail"
  | "create.chip.date"
  | "create.chip.time"
  | "create.chip.timeFixed"
  | "create.chip.timeRange"
  | "create.chip.from"
  | "create.chip.to"
  | "create.chip.timeFromShort"
  | "create.chip.timeToShort"
  | "create.chip.timePlaceholder"
  | "create.chip.fromPlaceholder"
  | "create.chip.toPlaceholder"
  | "create.chip.timeEmpty"
  | "create.chip.place"
  | "create.chip.venue"
  | "create.chip.city"
  | "create.chip.venuePlaceholder"
  | "create.chip.cityPlaceholder"
  | "create.chip.price"
  | "create.chip.priceFree"
  | "create.chip.pricePaid"
  | "create.chip.priceLabel"
  | "create.chip.priceAmount"
  | "create.chip.priceAdd"
  | "create.chip.priceRemove"
  | "create.chip.priceFreeNote"
  | "create.chip.choose"
  | "create.chip.placeIn"
  | "create.chip.pricePlus"
  | "create.artists.title"
  | "create.artists.optional"
  | "create.cta"
  | "create.ctaSoon"
  | "create.soonNote"
  | "create.soonTooltip"
  | "create.footer"
  // ── Editor (subset visible: sidebar tools + top toolbar + floating bar) ──
  | "editor.tool.design"
  | "editor.tool.text"
  | "editor.tool.elements"
  | "editor.tool.photos"
  | "editor.tool.background"
  | "editor.tool.layers"
  | "editor.tool.ai"
  | "editor.tool.brand"
  | "editor.tool.favorites"
  | "editor.tool.comingSoon"
  | "editor.action.undo"
  | "editor.action.redo"
  | "editor.action.save"
  | "editor.action.download"
  | "editor.action.share"
  | "editor.action.shareSoon"
  | "editor.action.saveDraft"
  | "editor.action.exporting"
  | "editor.fab.edit"
  | "editor.fab.image"
  | "editor.fab.imageTitle"
  | "editor.fab.styles"
  | "editor.fab.stylesTitle"
  | "editor.fab.align"
  | "editor.fab.alignTitle"
  | "editor.fab.lock"
  | "editor.fab.unlock"
  | "editor.fab.delete"
  | "editor.fab.more"
  | "editor.fab.duplicate"
  | "editor.fab.layerUp"
  | "editor.fab.layerDown"
  | "editor.fab.flipH"
  | "editor.fab.flipV"
  | "editor.align.left"
  | "editor.align.centerH"
  | "editor.align.right"
  | "editor.align.top"
  | "editor.align.centerV"
  | "editor.align.bottom"
  | "editor.layerName.image"
  | "editor.layerName.rect"
  | "editor.layerName.circle"
  | "editor.layerName.triangle"
  | "editor.layerName.line"
  | "editor.layerName.star"
  | "editor.layerName.hexagon"
  | "editor.layerName.arrow"
  | "editor.layerName.frame"
  | "editor.layerName.text"
  | "editor.fallback.title"
  | "editor.deleteLayer"
  // ── EDITOR MOBILE V3 (Fase P.1 — Header + Bottom + comunes) ──
  | "mobileEditor.header.back"
  | "mobileEditor.header.undo"
  | "mobileEditor.header.redo"
  | "mobileEditor.header.save"
  | "mobileEditor.header.saveShort"
  | "mobileEditor.header.saveNew"
  | "mobileEditor.header.more"
  | "mobileEditor.header.export"
  | "mobileEditor.header.loading"
  | "mobileEditor.header.renameLabel"
  | "mobileEditor.header.renameTitle"
  | "mobileEditor.header.renamePromptName"
  | "mobileEditor.state.saved"
  | "mobileEditor.state.saving"
  | "mobileEditor.state.unsaved"
  | "mobileEditor.bottomBar.templates"
  | "mobileEditor.bottomBar.add"
  | "mobileEditor.bottomBar.photo"
  | "mobileEditor.bottomBar.style"
  | "mobileEditor.bottomBar.remix"
  | "mobileEditor.confirm.exitUnsaved"
  | "mobileEditor.confirm.resetTemplate"
  | "mobileEditor.confirm.changeFormatUnsaved"
  | "mobileEditor.toast.savedOk"
  | "mobileEditor.toast.savedFail"
  | "mobileEditor.toast.savedError"
  | "mobileEditor.toast.loginToSave"
  | "mobileEditor.toast.loginToDownload"
  | "mobileEditor.toast.loginToUseAI"
  | "mobileEditor.fab.edit"
  | "mobileEditor.fab.layerUp"
  | "mobileEditor.fab.layerDown"
  | "mobileEditor.fab.duplicate"
  | "mobileEditor.fab.centerCanvas"
  | "mobileEditor.fab.lock"
  | "mobileEditor.fab.unlock"
  | "mobileEditor.fab.delete"
  | "mobileEditor.fab.done"
  | "mobileEditor.toast.objectLocked"
  | "mobileEditor.toast.objectUnlocked"
  | "mobileEditor.toast.centeredCanvas"
  // ── SUB-TOOLS LABELS (Fase P.2) ──
  | "mobileEditor.subtool.edit"
  | "mobileEditor.subtool.font"
  | "mobileEditor.subtool.styles"
  | "mobileEditor.subtool.size"
  | "mobileEditor.subtool.color"
  | "mobileEditor.subtool.replace"
  | "mobileEditor.subtool.crop"
  | "mobileEditor.subtool.filters"
  | "mobileEditor.subtool.removeBg"
  | "mobileEditor.subtool.opacity"
  | "mobileEditor.subtool.border"
  | "mobileEditor.subtool.corners"
  // ── STYLE PRESETS (texto avanzado) ──
  | "mobileEditor.text.shadow"
  | "mobileEditor.text.shadowActive"
  | "mobileEditor.text.shadowNone"
  | "mobileEditor.text.shadowSoft"
  | "mobileEditor.text.shadowStrong"
  | "mobileEditor.text.shadowGlow"
  | "mobileEditor.text.outline"
  | "mobileEditor.text.lineHeight"
  | "mobileEditor.text.charSpacing"
  | "mobileEditor.text.bold"
  | "mobileEditor.text.italic"
  | "mobileEditor.text.underline"
  | "mobileEditor.text.alignLeft"
  | "mobileEditor.text.alignCenter"
  | "mobileEditor.text.alignRight"
  | "mobileEditor.text.reset"
  | "mobileEditor.text.fontSizeLabel"
  // ── CROP ──
  | "mobileEditor.crop.square"
  | "mobileEditor.crop.rounded"
  | "mobileEditor.crop.circle"
  // ── FILTERS ──
  | "mobileEditor.filters.presets"
  | "mobileEditor.filters.original"
  | "mobileEditor.filters.bw"
  | "mobileEditor.filters.warm"
  | "mobileEditor.filters.cool"
  | "mobileEditor.filters.vintage"
  | "mobileEditor.filters.fineAdjust"
  | "mobileEditor.filters.brightness"
  | "mobileEditor.filters.contrast"
  | "mobileEditor.filters.saturation"
  | "mobileEditor.filters.rotateFlip"
  | "mobileEditor.filters.rotation"
  | "mobileEditor.filters.flipH"
  | "mobileEditor.filters.flipV"
  | "mobileEditor.toast.flippedH"
  | "mobileEditor.toast.flippedV"
  // ── REMOVE BG ──
  | "mobileEditor.removeBg.title"
  | "mobileEditor.removeBg.desc"
  | "mobileEditor.removeBg.loadingTitle"
  | "mobileEditor.removeBg.loadingDesc"
  | "mobileEditor.removeBg.button"
  | "mobileEditor.removeBg.buttonLoading"
  | "mobileEditor.toast.bgRemoved"
  | "mobileEditor.toast.bgFailed"
  | "mobileEditor.toast.selectImageFirst"
  | "mobileEditor.toast.imageError"
  // ── REPLACE ──
  | "mobileEditor.replace.button"
  | "mobileEditor.replace.hint"
  | "mobileEditor.toast.imageReplaced"
  | "mobileEditor.toast.imageLoadError"
  // ── BORDER (shape) ──
  | "mobileEditor.border.thickness"
  | "mobileEditor.border.remove"
  // ── CORNERS ──
  | "mobileEditor.corners.label"
  | "mobileEditor.corners.onlyRect"
  // ── COLOR SWATCH ARIA ──
  | "mobileEditor.aria.colorSwatch"
  | "mobileEditor.aria.borderColor"
  // ── ADD ELEMENT toasts ──
  | "mobileEditor.toast.textAdded"
  | "mobileEditor.toast.shapeAdded"
  | "mobileEditor.toast.imageAdded";

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
  // /projects
  "projects.title": "Mis flyers",
  "projects.subtitle.one": "{n} proyecto guardado",
  "projects.subtitle.many": "{n} proyectos guardados",
  "projects.newFlyer": "Nuevo flyer",
  "projects.loginRequired.title": "Inicia sesión para ver tus flyers",
  "projects.loginRequired.body": "Guarda y accede a todos tus diseños desde cualquier dispositivo.",
  "projects.loginRequired.cta": "Ir al inicio",
  "projects.empty.title": "Aún no tienes flyers guardados",
  "projects.empty.body": "Crea tu primer flyer y guárdalo para acceder desde cualquier dispositivo.",
  "projects.empty.cta": "Explorar plantillas",
  "projects.card.editAria": "Editar",
  "projects.card.deleteAria": "Eliminar",
  "projects.card.edit": "Editar",
  "projects.confirmDelete": "¿Eliminar este proyecto?",
  // /history
  "history.title": "Historial",
  "history.body": "Aquí irá el historial de generaciones y exportaciones.",
  // /colaboradores
  "collab.title": "Colaboradores",
  "collab.subtitle": "Personas y marcas que aparecen en tus flyers",
  "collab.invite": "Invitar colaborador",
  "collab.tab.people": "Personas",
  "collab.tab.brands": "Marcas",
  "collab.search.people": "Buscar personas…",
  "collab.search.brands": "Buscar marcas…",
  "collab.sort.recent": "Más recientes",
  "collab.sort.alpha": "Alfabético",
  "collab.sort.recentShort": "Recientes",
  "collab.sort.alphaShort": "A-Z",
  "collab.empty.noResults": "No hay resultados para tu búsqueda",
  "collab.empty.people.title": "Sin personas todavía",
  "collab.empty.brands.title": "Sin marcas todavía",
  "collab.empty.people.body": "Invita a artistas, profes o ponentes a registrarse",
  "collab.empty.brands.body": "Invita patrocinadores o empresas colaboradoras",
  "collab.card.editBrand": "Editar marca",
  "collab.card.editRole": "Editar rol",
  "collab.card.askUpdate": "Pedir actualización",
  "collab.card.delete": "Eliminar",
  "collab.modal.editBrand.title": "Editar marca",
  "collab.modal.editRole.title": "Editar rol",
  "collab.modal.editBrand.body": "Puedes editar el nombre y rol de la marca.",
  "collab.modal.editRole.body": "Solo puedes editar el rol (etiqueta interna). Para cambiar nombre/teléfono/foto, usa 'Pedir actualización'.",
  "collab.modal.name": "Nombre",
  "collab.modal.role": "Rol",
  "collab.modal.optional": "(opcional)",
  "collab.modal.role.placeholderBrand": "Ej: Patrocinador oficial",
  "collab.modal.role.placeholderPerson": "Ej: DJ, Profesor",
  "collab.modal.gdprNotice": "Por RGPD no puedes modificar nombre, teléfono ni foto de una persona sin su consentimiento. Usa \"Pedir actualización\" en el menú para mandarle un nuevo link.",
  "collab.modal.saving": "Guardando…",
  "collab.modal.save": "Guardar",
  "collab.invite.title": "Invitar colaborador",
  "collab.invite.body": "Comparte este link. El colaborador decidirá si es persona o marca al abrirlo.",
  "collab.invite.linkLabel": "Enlace único · caduca en 7 días",
  "collab.invite.copied": "Copiado",
  "collab.invite.copy": "Copiar",
  "collab.invite.whatsapp": "WhatsApp",
  "collab.invite.whatsappMessage": "Hola! Te comparto un enlace para que registres tus datos como colaborador en el próximo evento:\n\n{url}\n\nCaduca en 7 días.",
  "collab.reinvite.title": "Pedir actualización",
  "collab.reinvite.body": "Comparte este link con {name} para que actualice sus datos.",
  "collab.reinvite.whatsappMessage": "Hola {name}, ¿podrías actualizar tus datos? Aquí tienes el enlace (caduca en 7 días):\n\n{url}",
  "collab.delete.title": "¿Eliminar a {name}?",
  "collab.delete.body": "Esta acción es permanente. La foto y todos sus datos se eliminarán definitivamente.",
  "collab.delete.cancel": "Cancelar",
  "collab.delete.confirm": "Eliminar",
  "collab.delete.deleting": "Eliminando…",
  "collab.error.load": "Error al cargar",
  "collab.error.unknown": "Error desconocido",
  "collab.error.invite": "Error al generar invitación",
  "collab.error.save": "Error al guardar",
  "collab.error.reinvite": "Error al generar enlace",
  "collab.error.delete": "Error al eliminar",
  // /admin/templates
  "admin.tpl.title": "Admin · Plantillas",
  "admin.tpl.internal": "INTERNO",
  "admin.tpl.subtitle": "{n} plantillas en el catálogo · Tags solo visibles aquí",
  "admin.tpl.newTemplate": "✦ Crear nueva plantilla",
  "admin.tpl.discard": "Descartar",
  "admin.tpl.viewChanges": "Ver cambios",
  "admin.tpl.search.placeholder": "Buscar por título, categoría o id…",
  "admin.tpl.sort.newFirst": "Nuevas primero",
  "admin.tpl.sort.oldFirst": "Antiguas primero",
  "admin.tpl.filter.all": "Todas",
  "admin.tpl.filter.untagged": "Sin tag",
  "admin.tpl.empty": "Sin resultados con esos filtros",
  "admin.tpl.modified": "MODIFICADA",
  "admin.tpl.variants": "variante(s)",
  "admin.tpl.premium": "Premium",
  "admin.tpl.internalTags": "Tags internos",
  "admin.tpl.pagination.showing": "Mostrando",
  "admin.tpl.pagination.of": "de",
  "admin.tpl.pagination.prev": "Página anterior",
  "admin.tpl.pagination.next": "Página siguiente",
  "admin.tpl.diff.title.one": "{n} cambio pendiente",
  "admin.tpl.diff.title.many": "{n} cambios pendientes",
  "admin.tpl.diff.subtitle": "Copia este fragmento y pégalo en data/templates.ts dentro de cada plantilla",
  "admin.tpl.diff.noTags": "(sin tags)",
  "admin.tpl.diff.warning": "Estos cambios NO se guardan automáticamente. Tienes que pegarlos en data/templates.ts y hacer commit. Si refrescas esta página, los perderás.",
  "admin.tpl.diff.copy": "Copiar fragmento TypeScript",
  "admin.tpl.diff.copied": "Copiado al portapapeles",
  // /admin/templates/new
  "admin.new.title": "Creador de plantillas",
  "admin.new.subtitle": "Crea borradores y publícalos al catálogo",
  "admin.new.create": "Nueva plantilla",
  "admin.new.creating": "Creando...",
  "admin.new.createShort": "Nueva",
  "admin.new.tab.drafts": "Borradores",
  "admin.new.tab.published": "Publicadas",
  "admin.new.drafts.empty.title": "No tienes borradores",
  "admin.new.drafts.empty.body": "Crea tu primera plantilla con el botón \"Nueva plantilla\".",
  "admin.new.published.empty.title": "No has publicado plantillas todavía",
  "admin.new.published.empty.body": "Termina un borrador y pulsa \"Publicar\" para que aparezca en el catálogo.",
  "admin.new.draft.status.draft": "Borrador",
  "admin.new.draft.status.ready": "Listo",
  "admin.new.draft.status.archived": "Archivado",
  "admin.new.published.status": "Publicada",
  "admin.new.card.delete": "Eliminar borrador",
  "admin.new.card.unpublish": "Despublicar",
  "admin.new.card.edit": "Editar",
  "admin.new.confirm.delete": "¿Eliminar borrador \"{title}\"?",
  "admin.new.confirm.unpublish": "¿Despublicar \"{title}\"? Dejara de verse en /templates.",
  "admin.new.error.editPublished": "No se pudo abrir la plantilla para editar.",
  "admin.new.firstTemplate.title": "Nueva plantilla",
  "admin.new.firstTemplate.untitled": "Plantilla sin título",
  "admin.new.firstTemplate.cat": "Otros",
  // /create
  "create.examples.0": "Crea un flyer para un concierto con 2 artistas…",
  "create.examples.1": "Diseña un cartel para una fiesta este sábado…",
  "create.examples.2": "Haz un flyer con neón morado y dorado…",
  "create.examples.3": "Festival con 10 artistas y entrada premium…",
  "create.chips.0": "Fiesta este sábado",
  "create.chips.1": "Concierto en directo",
  "create.chips.2": "Festival al aire libre",
  "create.chips.3": "Clase abierta",
  "create.gen.title": "Creando tu flyer",
  "create.gen.step.analyze": "Analizando tu evento...",
  "create.gen.step.bg": "Generando fondo premium...",
  "create.gen.step.artists": "Procesando artistas...",
  "create.gen.step.preview": "Componiendo preview...",
  "create.gen.label.analyze": "Analizando evento",
  "create.gen.label.bg": "Generando fondo premium",
  "create.gen.label.artists": "Procesando artistas",
  "create.gen.label.preview": "Componiendo preview",
  "create.gen.footnote": "El fondo se genera sin texto — el texto se añade como capa editable",
  "create.gen.error": "Error",
  "create.gen.error.unknown": "desconocido",
  "create.badge.soon": "Próximamente",
  "create.title.line1": "Diseña flyers que",
  "create.title.highlight": "impactan",
  "create.sub.admin.lead": "Describe tu evento y la ",
  "create.sub.admin.ai": "IA",
  "create.sub.admin.tail": " genera el flyer perfecto.",
  "create.sub.guest.lead": "Generación con IA llegará pronto. Mientras tanto, ",
  "create.sub.guest.link": "explora nuestras plantillas",
  "create.sub.guest.tail": ".",
  "create.chip.date": "Fecha",
  "create.chip.time": "Hora",
  "create.chip.timeFixed": "Hora fija",
  "create.chip.timeRange": "Rango horario",
  "create.chip.from": "Desde",
  "create.chip.to": "Hasta",
  "create.chip.timeFromShort": "Desde {time}",
  "create.chip.timeToShort": "Hasta {time}",
  "create.chip.timePlaceholder": "Ej: 22:00",
  "create.chip.fromPlaceholder": "22:00",
  "create.chip.toPlaceholder": "06:00",
  "create.chip.timeEmpty": "Elige una opción",
  "create.chip.place": "Lugar",
  "create.chip.venue": "Sala",
  "create.chip.city": "Ciudad",
  "create.chip.venuePlaceholder": "Ej: Sala Apolo",
  "create.chip.cityPlaceholder": "Ej: Madrid",
  "create.chip.price": "Precio",
  "create.chip.priceFree": "Entrada libre",
  "create.chip.pricePaid": "Con precio",
  "create.chip.priceLabel": "Etiqueta",
  "create.chip.priceAmount": "8€",
  "create.chip.priceAdd": "+ Añadir precio",
  "create.chip.priceRemove": "Eliminar precio",
  "create.chip.priceFreeNote": "El flyer indicará que la entrada es libre",
  "create.chip.choose": "Elige una opción",
  "create.chip.placeIn": "en {place}",
  "create.chip.pricePlus": "{first} +{rest} más",
  "create.artists.title": "Artistas y logos",
  "create.artists.optional": "(opcional)",
  "create.cta": "Generar flyer",
  "create.ctaSoon": "Generar flyer · Próximamente",
  "create.soonNote": "Esta función estará disponible próximamente.",
  "create.soonTooltip": "Esta función estará disponible próximamente.",
  "create.footer": "El fondo se genera sin texto · Todo es editable después",
  // Editor
  "editor.tool.design": "Diseño",
  "editor.tool.text": "Texto",
  "editor.tool.elements": "Elementos",
  "editor.tool.photos": "Fotos",
  "editor.tool.background": "Fondo",
  "editor.tool.layers": "Capas",
  "editor.tool.ai": "IA Tools",
  "editor.tool.brand": "Brand Kit",
  "editor.tool.favorites": "Favoritos",
  "editor.tool.comingSoon": "próximamente",
  "editor.action.undo": "Deshacer",
  "editor.action.redo": "Rehacer",
  "editor.action.save": "Guardar borrador (Supabase)",
  "editor.action.download": "Descargar",
  "editor.action.share": "Compartir",
  "editor.action.shareSoon": "Compartir (próximamente)",
  "editor.action.saveDraft": "Guardar",
  "editor.action.exporting": "Exportando…",
  "editor.fab.edit": "Editar",
  "editor.fab.image": "Imagen",
  "editor.fab.imageTitle": "Añadir imagen",
  "editor.fab.styles": "Estilos",
  "editor.fab.stylesTitle": "Abrir panel de estilos",
  "editor.fab.align": "Alinear",
  "editor.fab.alignTitle": "Alinear",
  "editor.fab.lock": "Bloquear",
  "editor.fab.unlock": "Desbloq.",
  "editor.fab.delete": "Eliminar",
  "editor.fab.more": "Más opciones",
  "editor.fab.duplicate": "Duplicar",
  "editor.fab.layerUp": "Subir capa",
  "editor.fab.layerDown": "Bajar capa",
  "editor.fab.flipH": "Voltear H",
  "editor.fab.flipV": "Voltear V",
  "editor.align.left": "Izq",
  "editor.align.centerH": "C·H",
  "editor.align.right": "Der",
  "editor.align.top": "Arr",
  "editor.align.centerV": "C·V",
  "editor.align.bottom": "Aba",
  "editor.layerName.image": "Imagen",
  "editor.layerName.rect": "Rectángulo",
  "editor.layerName.circle": "Círculo",
  "editor.layerName.triangle": "Triángulo",
  "editor.layerName.line": "Línea",
  "editor.layerName.star": "Estrella",
  "editor.layerName.hexagon": "Hexágono",
  "editor.layerName.arrow": "Flecha",
  "editor.layerName.frame": "Marco",
  "editor.layerName.text": "Texto",
  "editor.fallback.title": "Editor",
  "editor.deleteLayer": "Eliminar capa",
  // ── EDITOR MOBILE V3 ──
  "mobileEditor.header.back": "Volver",
  "mobileEditor.header.undo": "Deshacer",
  "mobileEditor.header.redo": "Rehacer",
  "mobileEditor.header.save": "Guardar cambios",
  "mobileEditor.header.saveShort": "Guardar",
  "mobileEditor.header.saveNew": "Guardar nuevo diseño",
  "mobileEditor.header.more": "Más",
  "mobileEditor.header.export": "Exportar",
  "mobileEditor.header.loading": "Cargando…",
  "mobileEditor.header.renameLabel": "Renombrar flyer",
  "mobileEditor.header.renameTitle": "Tap para renombrar",
  "mobileEditor.header.renamePromptName": "Nombre del flyer",
  "mobileEditor.state.saved": "Guardado",
  "mobileEditor.state.saving": "Guardando…",
  "mobileEditor.state.unsaved": "Sin guardar",
  "mobileEditor.bottomBar.templates": "Plantillas",
  "mobileEditor.bottomBar.add": "Añadir",
  "mobileEditor.bottomBar.photo": "Foto",
  "mobileEditor.bottomBar.style": "Estilo",
  "mobileEditor.bottomBar.remix": "Remix",
  "mobileEditor.confirm.exitUnsaved": "Tienes cambios sin guardar. ¿Seguro que quieres salir?",
  "mobileEditor.confirm.resetTemplate": "¿Volver al diseño original?\n\nPerderás todos los cambios no guardados.",
  "mobileEditor.confirm.changeFormatUnsaved": "Tienes cambios sin guardar. ¿Cambiar de formato igualmente? Se perderán.",
  "mobileEditor.toast.savedOk": "Diseño guardado",
  "mobileEditor.toast.savedFail": "No se pudo guardar",
  "mobileEditor.toast.savedError": "Error al guardar",
  "mobileEditor.toast.loginToSave": "Inicia sesión para guardar",
  "mobileEditor.toast.loginToDownload": "Inicia sesión para descargar",
  "mobileEditor.toast.loginToUseAI": "Inicia sesión para usar IA",
  "mobileEditor.fab.edit": "Editar",
  "mobileEditor.fab.layerUp": "Subir",
  "mobileEditor.fab.layerDown": "Bajar",
  "mobileEditor.fab.duplicate": "Duplicar",
  "mobileEditor.fab.centerCanvas": "Centrar al canvas",
  "mobileEditor.fab.lock": "Bloquear",
  "mobileEditor.fab.unlock": "Desbloquear",
  "mobileEditor.fab.delete": "Borrar",
  "mobileEditor.fab.done": "Listo",
  "mobileEditor.toast.objectLocked": "Objeto bloqueado",
  "mobileEditor.toast.objectUnlocked": "Objeto desbloqueado",
  "mobileEditor.toast.centeredCanvas": "Centrado en el canvas",
  // ── SUB-TOOLS ──
  "mobileEditor.subtool.edit": "Editar",
  "mobileEditor.subtool.font": "Fuente",
  "mobileEditor.subtool.styles": "Estilos",
  "mobileEditor.subtool.size": "Tamaño",
  "mobileEditor.subtool.color": "Color",
  "mobileEditor.subtool.replace": "Reemplazar",
  "mobileEditor.subtool.crop": "Recortar",
  "mobileEditor.subtool.filters": "Filtros",
  "mobileEditor.subtool.removeBg": "Quitar fondo",
  "mobileEditor.subtool.opacity": "Opacidad",
  "mobileEditor.subtool.border": "Borde",
  "mobileEditor.subtool.corners": "Esquinas",
  "mobileEditor.text.shadow": "Sombra",
  "mobileEditor.text.shadowActive": "Activa",
  "mobileEditor.text.shadowNone": "Ninguna",
  "mobileEditor.text.shadowSoft": "Suave",
  "mobileEditor.text.shadowStrong": "Fuerte",
  "mobileEditor.text.shadowGlow": "Glow",
  "mobileEditor.text.outline": "Borde texto",
  "mobileEditor.text.lineHeight": "Interlineado",
  "mobileEditor.text.charSpacing": "Espaciado letras",
  "mobileEditor.text.bold": "Negrita",
  "mobileEditor.text.italic": "Cursiva",
  "mobileEditor.text.underline": "Subrayado",
  "mobileEditor.text.alignLeft": "Alinear a la izquierda",
  "mobileEditor.text.alignCenter": "Centrar",
  "mobileEditor.text.alignRight": "Alinear a la derecha",
  "mobileEditor.text.reset": "Restablecer formato",
  "mobileEditor.text.fontSizeLabel": "Tamaño",
  "mobileEditor.crop.square": "Cuadrado",
  "mobileEditor.crop.rounded": "Redondeado",
  "mobileEditor.crop.circle": "Círculo",
  "mobileEditor.filters.presets": "Presets",
  "mobileEditor.filters.original": "Original",
  "mobileEditor.filters.bw": "B&N",
  "mobileEditor.filters.warm": "Cálido",
  "mobileEditor.filters.cool": "Frío",
  "mobileEditor.filters.vintage": "Vintage",
  "mobileEditor.filters.fineAdjust": "Ajuste fino",
  "mobileEditor.filters.brightness": "Brillo",
  "mobileEditor.filters.contrast": "Contraste",
  "mobileEditor.filters.saturation": "Saturación",
  "mobileEditor.filters.rotateFlip": "Rotar / voltear",
  "mobileEditor.filters.rotation": "Rotación",
  "mobileEditor.filters.flipH": "↔ Horizontal",
  "mobileEditor.filters.flipV": "↕ Vertical",
  "mobileEditor.toast.flippedH": "Volteado horizontal",
  "mobileEditor.toast.flippedV": "Volteado vertical",
  "mobileEditor.removeBg.title": "Quitar fondo con IA",
  "mobileEditor.removeBg.desc": "BRIA detecta el sujeto automáticamente y elimina el fondo. Funciona mejor con fotos de personas u objetos centrados.",
  "mobileEditor.removeBg.loadingTitle": "Eliminando fondo…",
  "mobileEditor.removeBg.loadingDesc": "Esto tarda 2-4 segundos. No cierres la app.",
  "mobileEditor.removeBg.button": "Quitar fondo ahora",
  "mobileEditor.removeBg.buttonLoading": "Procesando…",
  "mobileEditor.toast.bgRemoved": "Fondo eliminado",
  "mobileEditor.toast.bgFailed": "La IA falló — intenta de nuevo",
  "mobileEditor.toast.selectImageFirst": "Selecciona primero una imagen",
  "mobileEditor.toast.imageError": "Error procesando la imagen",
  "mobileEditor.replace.button": "Elegir imagen de tu galería",
  "mobileEditor.replace.hint": "Se mantiene la posición y el tamaño actuales",
  "mobileEditor.toast.imageReplaced": "Imagen reemplazada",
  "mobileEditor.toast.imageLoadError": "No se pudo cargar la imagen",
  "mobileEditor.border.thickness": "Grosor",
  "mobileEditor.border.remove": "Quitar borde",
  "mobileEditor.corners.label": "Esquinas",
  "mobileEditor.corners.onlyRect": "Las esquinas redondeadas solo aplican a rectángulos.",
  "mobileEditor.aria.colorSwatch": "Color",
  "mobileEditor.aria.borderColor": "Color borde",
  "mobileEditor.toast.textAdded": "Texto añadido",
  "mobileEditor.toast.shapeAdded": "Forma añadida",
  "mobileEditor.toast.imageAdded": "Imagen añadida",
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
  // /projects
  "projects.title": "My flyers",
  "projects.subtitle.one": "{n} project saved",
  "projects.subtitle.many": "{n} projects saved",
  "projects.newFlyer": "New flyer",
  "projects.loginRequired.title": "Sign in to see your flyers",
  "projects.loginRequired.body": "Save and access all your designs from any device.",
  "projects.loginRequired.cta": "Go to home",
  "projects.empty.title": "You don't have any saved flyers yet",
  "projects.empty.body": "Create your first flyer and save it to access from any device.",
  "projects.empty.cta": "Explore templates",
  "projects.card.editAria": "Edit",
  "projects.card.deleteAria": "Delete",
  "projects.card.edit": "Edit",
  "projects.confirmDelete": "Delete this project?",
  // /history
  "history.title": "History",
  "history.body": "Your generation and export history will appear here.",
  // /colaboradores
  "collab.title": "Collaborators",
  "collab.subtitle": "People and brands appearing in your flyers",
  "collab.invite": "Invite collaborator",
  "collab.tab.people": "People",
  "collab.tab.brands": "Brands",
  "collab.search.people": "Search people…",
  "collab.search.brands": "Search brands…",
  "collab.sort.recent": "Most recent",
  "collab.sort.alpha": "Alphabetical",
  "collab.sort.recentShort": "Recent",
  "collab.sort.alphaShort": "A-Z",
  "collab.empty.noResults": "No results for your search",
  "collab.empty.people.title": "No people yet",
  "collab.empty.brands.title": "No brands yet",
  "collab.empty.people.body": "Invite artists, teachers or speakers to register",
  "collab.empty.brands.body": "Invite sponsors or partner companies",
  "collab.card.editBrand": "Edit brand",
  "collab.card.editRole": "Edit role",
  "collab.card.askUpdate": "Request update",
  "collab.card.delete": "Delete",
  "collab.modal.editBrand.title": "Edit brand",
  "collab.modal.editRole.title": "Edit role",
  "collab.modal.editBrand.body": "You can edit the brand name and role.",
  "collab.modal.editRole.body": "You can only edit the role (internal label). To change name/phone/photo, use 'Request update'.",
  "collab.modal.name": "Name",
  "collab.modal.role": "Role",
  "collab.modal.optional": "(optional)",
  "collab.modal.role.placeholderBrand": "Eg: Official sponsor",
  "collab.modal.role.placeholderPerson": "Eg: DJ, Teacher",
  "collab.modal.gdprNotice": "By GDPR you can't modify a person's name, phone or photo without their consent. Use \"Request update\" in the menu to send them a new link.",
  "collab.modal.saving": "Saving…",
  "collab.modal.save": "Save",
  "collab.invite.title": "Invite collaborator",
  "collab.invite.body": "Share this link. The collaborator decides if they're a person or brand when they open it.",
  "collab.invite.linkLabel": "Unique link · expires in 7 days",
  "collab.invite.copied": "Copied",
  "collab.invite.copy": "Copy",
  "collab.invite.whatsapp": "WhatsApp",
  "collab.invite.whatsappMessage": "Hi! Here's a link to register your details as a collaborator for the next event:\n\n{url}\n\nExpires in 7 days.",
  "collab.reinvite.title": "Request update",
  "collab.reinvite.body": "Share this link with {name} so they can update their details.",
  "collab.reinvite.whatsappMessage": "Hi {name}, could you update your details? Here's the link (expires in 7 days):\n\n{url}",
  "collab.delete.title": "Delete {name}?",
  "collab.delete.body": "This action is permanent. The photo and all their data will be deleted definitively.",
  "collab.delete.cancel": "Cancel",
  "collab.delete.confirm": "Delete",
  "collab.delete.deleting": "Deleting…",
  "collab.error.load": "Loading error",
  "collab.error.unknown": "Unknown error",
  "collab.error.invite": "Error generating invitation",
  "collab.error.save": "Save error",
  "collab.error.reinvite": "Error generating link",
  "collab.error.delete": "Delete error",
  // /admin/templates
  "admin.tpl.title": "Admin · Templates",
  "admin.tpl.internal": "INTERNAL",
  "admin.tpl.subtitle": "{n} templates in catalog · Tags only visible here",
  "admin.tpl.newTemplate": "✦ Create new template",
  "admin.tpl.discard": "Discard",
  "admin.tpl.viewChanges": "View changes",
  "admin.tpl.search.placeholder": "Search by title, category or id…",
  "admin.tpl.sort.newFirst": "Newest first",
  "admin.tpl.sort.oldFirst": "Oldest first",
  "admin.tpl.filter.all": "All",
  "admin.tpl.filter.untagged": "Untagged",
  "admin.tpl.empty": "No results with those filters",
  "admin.tpl.modified": "MODIFIED",
  "admin.tpl.variants": "variant(s)",
  "admin.tpl.premium": "Premium",
  "admin.tpl.internalTags": "Internal tags",
  "admin.tpl.pagination.showing": "Showing",
  "admin.tpl.pagination.of": "of",
  "admin.tpl.pagination.prev": "Previous page",
  "admin.tpl.pagination.next": "Next page",
  "admin.tpl.diff.title.one": "{n} pending change",
  "admin.tpl.diff.title.many": "{n} pending changes",
  "admin.tpl.diff.subtitle": "Copy this snippet and paste it into data/templates.ts in each template",
  "admin.tpl.diff.noTags": "(no tags)",
  "admin.tpl.diff.warning": "These changes are NOT saved automatically. You have to paste them into data/templates.ts and commit. If you refresh this page, you'll lose them.",
  "admin.tpl.diff.copy": "Copy TypeScript snippet",
  "admin.tpl.diff.copied": "Copied to clipboard",
  // /admin/templates/new
  "admin.new.title": "Template creator",
  "admin.new.subtitle": "Create drafts and publish them to the catalog",
  "admin.new.create": "New template",
  "admin.new.creating": "Creating...",
  "admin.new.createShort": "New",
  "admin.new.tab.drafts": "Drafts",
  "admin.new.tab.published": "Published",
  "admin.new.drafts.empty.title": "No drafts yet",
  "admin.new.drafts.empty.body": "Create your first template with the \"New template\" button.",
  "admin.new.published.empty.title": "You haven't published templates yet",
  "admin.new.published.empty.body": "Finish a draft and click \"Publish\" so it appears in the catalog.",
  "admin.new.draft.status.draft": "Draft",
  "admin.new.draft.status.ready": "Ready",
  "admin.new.draft.status.archived": "Archived",
  "admin.new.published.status": "Published",
  "admin.new.card.delete": "Delete draft",
  "admin.new.card.unpublish": "Unpublish",
  "admin.new.card.edit": "Edit",
  "admin.new.confirm.delete": "Delete draft \"{title}\"?",
  "admin.new.confirm.unpublish": "Unpublish \"{title}\"? It will no longer appear in /templates.",
  "admin.new.error.editPublished": "Could not open template for editing.",
  "admin.new.firstTemplate.title": "New template",
  "admin.new.firstTemplate.untitled": "Untitled template",
  "admin.new.firstTemplate.cat": "Other",
  // /create
  "create.examples.0": "Create a flyer for a concert with 2 artists…",
  "create.examples.1": "Design a poster for a party this Saturday…",
  "create.examples.2": "Make a flyer with purple and gold neon…",
  "create.examples.3": "Festival with 10 artists and premium entry…",
  "create.chips.0": "Party this Saturday",
  "create.chips.1": "Live concert",
  "create.chips.2": "Outdoor festival",
  "create.chips.3": "Open class",
  "create.gen.title": "Creating your flyer",
  "create.gen.step.analyze": "Analyzing your event...",
  "create.gen.step.bg": "Generating premium background...",
  "create.gen.step.artists": "Processing artists...",
  "create.gen.step.preview": "Composing preview...",
  "create.gen.label.analyze": "Analyzing event",
  "create.gen.label.bg": "Generating premium background",
  "create.gen.label.artists": "Processing artists",
  "create.gen.label.preview": "Composing preview",
  "create.gen.footnote": "The background is generated without text — text is added as an editable layer",
  "create.gen.error": "Error",
  "create.gen.error.unknown": "unknown",
  "create.badge.soon": "Coming soon",
  "create.title.line1": "Design flyers that",
  "create.title.highlight": "stand out",
  "create.sub.admin.lead": "Describe your event and ",
  "create.sub.admin.ai": "AI",
  "create.sub.admin.tail": " generates the perfect flyer.",
  "create.sub.guest.lead": "AI generation coming soon. Meanwhile, ",
  "create.sub.guest.link": "explore our templates",
  "create.sub.guest.tail": ".",
  "create.chip.date": "Date",
  "create.chip.time": "Time",
  "create.chip.timeFixed": "Fixed time",
  "create.chip.timeRange": "Time range",
  "create.chip.from": "From",
  "create.chip.to": "To",
  "create.chip.timeFromShort": "From {time}",
  "create.chip.timeToShort": "Until {time}",
  "create.chip.timePlaceholder": "Eg: 22:00",
  "create.chip.fromPlaceholder": "22:00",
  "create.chip.toPlaceholder": "06:00",
  "create.chip.timeEmpty": "Pick an option",
  "create.chip.place": "Place",
  "create.chip.venue": "Venue",
  "create.chip.city": "City",
  "create.chip.venuePlaceholder": "Eg: Apolo Hall",
  "create.chip.cityPlaceholder": "Eg: Madrid",
  "create.chip.price": "Price",
  "create.chip.priceFree": "Free entry",
  "create.chip.pricePaid": "With price",
  "create.chip.priceLabel": "Label",
  "create.chip.priceAmount": "8€",
  "create.chip.priceAdd": "+ Add price",
  "create.chip.priceRemove": "Remove price",
  "create.chip.priceFreeNote": "The flyer will indicate free entry",
  "create.chip.choose": "Pick an option",
  "create.chip.placeIn": "at {place}",
  "create.chip.pricePlus": "{first} +{rest} more",
  "create.artists.title": "Artists and logos",
  "create.artists.optional": "(optional)",
  "create.cta": "Generate flyer",
  "create.ctaSoon": "Generate flyer · Coming soon",
  "create.soonNote": "This feature will be available soon.",
  "create.soonTooltip": "This feature will be available soon.",
  "create.footer": "Background generated without text · Everything is editable after",
  // Editor
  "editor.tool.design": "Design",
  "editor.tool.text": "Text",
  "editor.tool.elements": "Elements",
  "editor.tool.photos": "Photos",
  "editor.tool.background": "Background",
  "editor.tool.layers": "Layers",
  "editor.tool.ai": "AI Tools",
  "editor.tool.brand": "Brand Kit",
  "editor.tool.favorites": "Favorites",
  "editor.tool.comingSoon": "soon",
  "editor.action.undo": "Undo",
  "editor.action.redo": "Redo",
  "editor.action.save": "Save draft (Supabase)",
  "editor.action.download": "Download",
  "editor.action.share": "Share",
  "editor.action.shareSoon": "Share (coming soon)",
  "editor.action.saveDraft": "Save",
  "editor.action.exporting": "Exporting…",
  "editor.fab.edit": "Edit",
  "editor.fab.image": "Image",
  "editor.fab.imageTitle": "Add image",
  "editor.fab.styles": "Styles",
  "editor.fab.stylesTitle": "Open styles panel",
  "editor.fab.align": "Align",
  "editor.fab.alignTitle": "Align",
  "editor.fab.lock": "Lock",
  "editor.fab.unlock": "Unlock",
  "editor.fab.delete": "Delete",
  "editor.fab.more": "More options",
  "editor.fab.duplicate": "Duplicate",
  "editor.fab.layerUp": "Layer up",
  "editor.fab.layerDown": "Layer down",
  "editor.fab.flipH": "Flip H",
  "editor.fab.flipV": "Flip V",
  "editor.align.left": "Left",
  "editor.align.centerH": "C·H",
  "editor.align.right": "Right",
  "editor.align.top": "Top",
  "editor.align.centerV": "C·V",
  "editor.align.bottom": "Bot",
  "editor.layerName.image": "Image",
  "editor.layerName.rect": "Rectangle",
  "editor.layerName.circle": "Circle",
  "editor.layerName.triangle": "Triangle",
  "editor.layerName.line": "Line",
  "editor.layerName.star": "Star",
  "editor.layerName.hexagon": "Hexagon",
  "editor.layerName.arrow": "Arrow",
  "editor.layerName.frame": "Frame",
  "editor.layerName.text": "Text",
  "editor.fallback.title": "Editor",
  "editor.deleteLayer": "Delete layer",
  // ── MOBILE EDITOR V3 ──
  "mobileEditor.header.back": "Back",
  "mobileEditor.header.undo": "Undo",
  "mobileEditor.header.redo": "Redo",
  "mobileEditor.header.save": "Save changes",
  "mobileEditor.header.saveShort": "Save",
  "mobileEditor.header.saveNew": "Save new design",
  "mobileEditor.header.more": "More",
  "mobileEditor.header.export": "Export",
  "mobileEditor.header.loading": "Loading…",
  "mobileEditor.header.renameLabel": "Rename flyer",
  "mobileEditor.header.renameTitle": "Tap to rename",
  "mobileEditor.header.renamePromptName": "Flyer name",
  "mobileEditor.state.saved": "Saved",
  "mobileEditor.state.saving": "Saving…",
  "mobileEditor.state.unsaved": "Unsaved",
  "mobileEditor.bottomBar.templates": "Templates",
  "mobileEditor.bottomBar.add": "Add",
  "mobileEditor.bottomBar.photo": "Photo",
  "mobileEditor.bottomBar.style": "Style",
  "mobileEditor.bottomBar.remix": "Remix",
  "mobileEditor.confirm.exitUnsaved": "You have unsaved changes. Are you sure you want to leave?",
  "mobileEditor.confirm.resetTemplate": "Restore the original design?\n\nYou will lose all unsaved changes.",
  "mobileEditor.confirm.changeFormatUnsaved": "You have unsaved changes. Change format anyway? They will be lost.",
  "mobileEditor.toast.savedOk": "Design saved",
  "mobileEditor.toast.savedFail": "Could not save",
  "mobileEditor.toast.savedError": "Error saving",
  "mobileEditor.toast.loginToSave": "Sign in to save",
  "mobileEditor.toast.loginToDownload": "Sign in to download",
  "mobileEditor.toast.loginToUseAI": "Sign in to use AI",
  "mobileEditor.fab.edit": "Edit",
  "mobileEditor.fab.layerUp": "Bring forward",
  "mobileEditor.fab.layerDown": "Send backward",
  "mobileEditor.fab.duplicate": "Duplicate",
  "mobileEditor.fab.centerCanvas": "Center on canvas",
  "mobileEditor.fab.lock": "Lock",
  "mobileEditor.fab.unlock": "Unlock",
  "mobileEditor.fab.delete": "Delete",
  "mobileEditor.fab.done": "Done",
  "mobileEditor.toast.objectLocked": "Object locked",
  "mobileEditor.toast.objectUnlocked": "Object unlocked",
  "mobileEditor.toast.centeredCanvas": "Centered on canvas",
  "mobileEditor.subtool.edit": "Edit",
  "mobileEditor.subtool.font": "Font",
  "mobileEditor.subtool.styles": "Styles",
  "mobileEditor.subtool.size": "Size",
  "mobileEditor.subtool.color": "Color",
  "mobileEditor.subtool.replace": "Replace",
  "mobileEditor.subtool.crop": "Crop",
  "mobileEditor.subtool.filters": "Filters",
  "mobileEditor.subtool.removeBg": "Remove BG",
  "mobileEditor.subtool.opacity": "Opacity",
  "mobileEditor.subtool.border": "Border",
  "mobileEditor.subtool.corners": "Corners",
  "mobileEditor.text.shadow": "Shadow",
  "mobileEditor.text.shadowActive": "Active",
  "mobileEditor.text.shadowNone": "None",
  "mobileEditor.text.shadowSoft": "Soft",
  "mobileEditor.text.shadowStrong": "Strong",
  "mobileEditor.text.shadowGlow": "Glow",
  "mobileEditor.text.outline": "Text border",
  "mobileEditor.text.lineHeight": "Line height",
  "mobileEditor.text.charSpacing": "Letter spacing",
  "mobileEditor.text.bold": "Bold",
  "mobileEditor.text.italic": "Italic",
  "mobileEditor.text.underline": "Underline",
  "mobileEditor.text.alignLeft": "Align left",
  "mobileEditor.text.alignCenter": "Center",
  "mobileEditor.text.alignRight": "Align right",
  "mobileEditor.text.reset": "Reset format",
  "mobileEditor.text.fontSizeLabel": "Size",
  "mobileEditor.crop.square": "Square",
  "mobileEditor.crop.rounded": "Rounded",
  "mobileEditor.crop.circle": "Circle",
  "mobileEditor.filters.presets": "Presets",
  "mobileEditor.filters.original": "Original",
  "mobileEditor.filters.bw": "B&W",
  "mobileEditor.filters.warm": "Warm",
  "mobileEditor.filters.cool": "Cool",
  "mobileEditor.filters.vintage": "Vintage",
  "mobileEditor.filters.fineAdjust": "Fine adjust",
  "mobileEditor.filters.brightness": "Brightness",
  "mobileEditor.filters.contrast": "Contrast",
  "mobileEditor.filters.saturation": "Saturation",
  "mobileEditor.filters.rotateFlip": "Rotate / flip",
  "mobileEditor.filters.rotation": "Rotation",
  "mobileEditor.filters.flipH": "↔ Horizontal",
  "mobileEditor.filters.flipV": "↕ Vertical",
  "mobileEditor.toast.flippedH": "Flipped horizontally",
  "mobileEditor.toast.flippedV": "Flipped vertically",
  "mobileEditor.removeBg.title": "Remove background with AI",
  "mobileEditor.removeBg.desc": "BRIA detects the subject automatically and removes the background. Works best with photos of people or centered objects.",
  "mobileEditor.removeBg.loadingTitle": "Removing background…",
  "mobileEditor.removeBg.loadingDesc": "This takes 2-4 seconds. Don't close the app.",
  "mobileEditor.removeBg.button": "Remove background now",
  "mobileEditor.removeBg.buttonLoading": "Processing…",
  "mobileEditor.toast.bgRemoved": "Background removed",
  "mobileEditor.toast.bgFailed": "AI failed — try again",
  "mobileEditor.toast.selectImageFirst": "Select an image first",
  "mobileEditor.toast.imageError": "Error processing image",
  "mobileEditor.replace.button": "Choose image from your gallery",
  "mobileEditor.replace.hint": "The current position and size are preserved",
  "mobileEditor.toast.imageReplaced": "Image replaced",
  "mobileEditor.toast.imageLoadError": "Could not load image",
  "mobileEditor.border.thickness": "Thickness",
  "mobileEditor.border.remove": "Remove border",
  "mobileEditor.corners.label": "Corners",
  "mobileEditor.corners.onlyRect": "Rounded corners only apply to rectangles.",
  "mobileEditor.aria.colorSwatch": "Color",
  "mobileEditor.aria.borderColor": "Border color",
  "mobileEditor.toast.textAdded": "Text added",
  "mobileEditor.toast.shapeAdded": "Shape added",
  "mobileEditor.toast.imageAdded": "Image added",
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
  // /projects
  "projects.title": "Mes flyers",
  "projects.subtitle.one": "{n} projet enregistré",
  "projects.subtitle.many": "{n} projets enregistrés",
  "projects.newFlyer": "Nouveau flyer",
  "projects.loginRequired.title": "Connecte-toi pour voir tes flyers",
  "projects.loginRequired.body": "Enregistre et accède à tous tes designs depuis n'importe quel appareil.",
  "projects.loginRequired.cta": "Aller à l'accueil",
  "projects.empty.title": "Tu n'as pas encore de flyers enregistrés",
  "projects.empty.body": "Crée ton premier flyer et enregistre-le pour y accéder depuis n'importe quel appareil.",
  "projects.empty.cta": "Explorer les modèles",
  "projects.card.editAria": "Éditer",
  "projects.card.deleteAria": "Supprimer",
  "projects.card.edit": "Éditer",
  "projects.confirmDelete": "Supprimer ce projet ?",
  // /history
  "history.title": "Historique",
  "history.body": "Ton historique de générations et d'exports apparaîtra ici.",
  // /colaboradores
  "collab.title": "Collaborateurs",
  "collab.subtitle": "Personnes et marques qui apparaissent dans tes flyers",
  "collab.invite": "Inviter un collaborateur",
  "collab.tab.people": "Personnes",
  "collab.tab.brands": "Marques",
  "collab.search.people": "Rechercher des personnes…",
  "collab.search.brands": "Rechercher des marques…",
  "collab.sort.recent": "Plus récents",
  "collab.sort.alpha": "Alphabétique",
  "collab.sort.recentShort": "Récents",
  "collab.sort.alphaShort": "A-Z",
  "collab.empty.noResults": "Aucun résultat pour ta recherche",
  "collab.empty.people.title": "Aucune personne pour l'instant",
  "collab.empty.brands.title": "Aucune marque pour l'instant",
  "collab.empty.people.body": "Invite des artistes, profs ou intervenants à s'inscrire",
  "collab.empty.brands.body": "Invite des sponsors ou entreprises partenaires",
  "collab.card.editBrand": "Éditer la marque",
  "collab.card.editRole": "Éditer le rôle",
  "collab.card.askUpdate": "Demander mise à jour",
  "collab.card.delete": "Supprimer",
  "collab.modal.editBrand.title": "Éditer la marque",
  "collab.modal.editRole.title": "Éditer le rôle",
  "collab.modal.editBrand.body": "Tu peux éditer le nom et le rôle de la marque.",
  "collab.modal.editRole.body": "Tu peux uniquement éditer le rôle (étiquette interne). Pour changer nom/téléphone/photo, utilise 'Demander mise à jour'.",
  "collab.modal.name": "Nom",
  "collab.modal.role": "Rôle",
  "collab.modal.optional": "(optionnel)",
  "collab.modal.role.placeholderBrand": "Ex : Sponsor officiel",
  "collab.modal.role.placeholderPerson": "Ex : DJ, Professeur",
  "collab.modal.gdprNotice": "Par RGPD tu ne peux pas modifier le nom, téléphone ou photo d'une personne sans son consentement. Utilise \"Demander mise à jour\" dans le menu pour lui envoyer un nouveau lien.",
  "collab.modal.saving": "Enregistrement…",
  "collab.modal.save": "Enregistrer",
  "collab.invite.title": "Inviter un collaborateur",
  "collab.invite.body": "Partage ce lien. Le collaborateur décidera s'il est une personne ou une marque en l'ouvrant.",
  "collab.invite.linkLabel": "Lien unique · expire dans 7 jours",
  "collab.invite.copied": "Copié",
  "collab.invite.copy": "Copier",
  "collab.invite.whatsapp": "WhatsApp",
  "collab.invite.whatsappMessage": "Salut ! Voici un lien pour enregistrer tes informations comme collaborateur pour le prochain événement :\n\n{url}\n\nExpire dans 7 jours.",
  "collab.reinvite.title": "Demander mise à jour",
  "collab.reinvite.body": "Partage ce lien avec {name} pour qu'il/elle mette à jour ses informations.",
  "collab.reinvite.whatsappMessage": "Salut {name}, peux-tu mettre à jour tes informations ? Voici le lien (expire dans 7 jours) :\n\n{url}",
  "collab.delete.title": "Supprimer {name} ?",
  "collab.delete.body": "Cette action est permanente. La photo et toutes ses données seront supprimées définitivement.",
  "collab.delete.cancel": "Annuler",
  "collab.delete.confirm": "Supprimer",
  "collab.delete.deleting": "Suppression…",
  "collab.error.load": "Erreur de chargement",
  "collab.error.unknown": "Erreur inconnue",
  "collab.error.invite": "Erreur lors de la génération de l'invitation",
  "collab.error.save": "Erreur d'enregistrement",
  "collab.error.reinvite": "Erreur lors de la génération du lien",
  "collab.error.delete": "Erreur de suppression",
  // /admin/templates
  "admin.tpl.title": "Admin · Modèles",
  "admin.tpl.internal": "INTERNE",
  "admin.tpl.subtitle": "{n} modèles dans le catalogue · Tags visibles uniquement ici",
  "admin.tpl.newTemplate": "✦ Créer nouveau modèle",
  "admin.tpl.discard": "Annuler",
  "admin.tpl.viewChanges": "Voir les changements",
  "admin.tpl.search.placeholder": "Rechercher par titre, catégorie ou id…",
  "admin.tpl.sort.newFirst": "Nouveaux d'abord",
  "admin.tpl.sort.oldFirst": "Anciens d'abord",
  "admin.tpl.filter.all": "Tous",
  "admin.tpl.filter.untagged": "Sans tag",
  "admin.tpl.empty": "Aucun résultat avec ces filtres",
  "admin.tpl.modified": "MODIFIÉ",
  "admin.tpl.variants": "variante(s)",
  "admin.tpl.premium": "Premium",
  "admin.tpl.internalTags": "Tags internes",
  "admin.tpl.pagination.showing": "Affichage",
  "admin.tpl.pagination.of": "de",
  "admin.tpl.pagination.prev": "Page précédente",
  "admin.tpl.pagination.next": "Page suivante",
  "admin.tpl.diff.title.one": "{n} changement en attente",
  "admin.tpl.diff.title.many": "{n} changements en attente",
  "admin.tpl.diff.subtitle": "Copie ce fragment et colle-le dans data/templates.ts dans chaque modèle",
  "admin.tpl.diff.noTags": "(sans tags)",
  "admin.tpl.diff.warning": "Ces changements ne sont PAS enregistrés automatiquement. Tu dois les coller dans data/templates.ts et commiter. Si tu rafraîchis cette page, tu les perdras.",
  "admin.tpl.diff.copy": "Copier le fragment TypeScript",
  "admin.tpl.diff.copied": "Copié dans le presse-papiers",
  // /admin/templates/new
  "admin.new.title": "Créateur de modèles",
  "admin.new.subtitle": "Crée des brouillons et publie-les au catalogue",
  "admin.new.create": "Nouveau modèle",
  "admin.new.creating": "Création...",
  "admin.new.createShort": "Nouveau",
  "admin.new.tab.drafts": "Brouillons",
  "admin.new.tab.published": "Publiés",
  "admin.new.drafts.empty.title": "Aucun brouillon",
  "admin.new.drafts.empty.body": "Crée ton premier modèle avec le bouton \"Nouveau modèle\".",
  "admin.new.published.empty.title": "Tu n'as pas encore publié de modèles",
  "admin.new.published.empty.body": "Termine un brouillon et clique sur \"Publier\" pour qu'il apparaisse dans le catalogue.",
  "admin.new.draft.status.draft": "Brouillon",
  "admin.new.draft.status.ready": "Prêt",
  "admin.new.draft.status.archived": "Archivé",
  "admin.new.published.status": "Publié",
  "admin.new.card.delete": "Supprimer le brouillon",
  "admin.new.card.unpublish": "Dépublier",
  "admin.new.card.edit": "Éditer",
  "admin.new.confirm.delete": "Supprimer le brouillon \"{title}\" ?",
  "admin.new.confirm.unpublish": "Dépublier \"{title}\" ? Il n'apparaîtra plus dans /templates.",
  "admin.new.error.editPublished": "Impossible d'ouvrir le modèle pour l'éditer.",
  "admin.new.firstTemplate.title": "Nouveau modèle",
  "admin.new.firstTemplate.untitled": "Modèle sans titre",
  "admin.new.firstTemplate.cat": "Autres",
  // /create
  "create.examples.0": "Crée un flyer pour un concert avec 2 artistes…",
  "create.examples.1": "Conçois une affiche pour une soirée ce samedi…",
  "create.examples.2": "Fais un flyer avec néon violet et doré…",
  "create.examples.3": "Festival avec 10 artistes et entrée premium…",
  "create.chips.0": "Soirée ce samedi",
  "create.chips.1": "Concert live",
  "create.chips.2": "Festival en plein air",
  "create.chips.3": "Cours ouvert",
  "create.gen.title": "Création de ton flyer",
  "create.gen.step.analyze": "Analyse de ton événement...",
  "create.gen.step.bg": "Génération du fond premium...",
  "create.gen.step.artists": "Traitement des artistes...",
  "create.gen.step.preview": "Composition du preview...",
  "create.gen.label.analyze": "Analyse événement",
  "create.gen.label.bg": "Génération fond premium",
  "create.gen.label.artists": "Traitement artistes",
  "create.gen.label.preview": "Composition preview",
  "create.gen.footnote": "Le fond est généré sans texte — le texte est ajouté comme calque éditable",
  "create.gen.error": "Erreur",
  "create.gen.error.unknown": "inconnue",
  "create.badge.soon": "Bientôt",
  "create.title.line1": "Conçois des flyers qui",
  "create.title.highlight": "marquent",
  "create.sub.admin.lead": "Décris ton événement et l'",
  "create.sub.admin.ai": "IA",
  "create.sub.admin.tail": " génère le flyer parfait.",
  "create.sub.guest.lead": "Génération avec IA bientôt disponible. En attendant, ",
  "create.sub.guest.link": "explore nos modèles",
  "create.sub.guest.tail": ".",
  "create.chip.date": "Date",
  "create.chip.time": "Heure",
  "create.chip.timeFixed": "Heure fixe",
  "create.chip.timeRange": "Plage horaire",
  "create.chip.from": "De",
  "create.chip.to": "À",
  "create.chip.timeFromShort": "Dès {time}",
  "create.chip.timeToShort": "Jusqu'à {time}",
  "create.chip.timePlaceholder": "Ex : 22:00",
  "create.chip.fromPlaceholder": "22:00",
  "create.chip.toPlaceholder": "06:00",
  "create.chip.timeEmpty": "Choisis une option",
  "create.chip.place": "Lieu",
  "create.chip.venue": "Salle",
  "create.chip.city": "Ville",
  "create.chip.venuePlaceholder": "Ex : Salle Apolo",
  "create.chip.cityPlaceholder": "Ex : Paris",
  "create.chip.price": "Prix",
  "create.chip.priceFree": "Entrée libre",
  "create.chip.pricePaid": "Avec prix",
  "create.chip.priceLabel": "Étiquette",
  "create.chip.priceAmount": "8€",
  "create.chip.priceAdd": "+ Ajouter prix",
  "create.chip.priceRemove": "Supprimer prix",
  "create.chip.priceFreeNote": "Le flyer indiquera que l'entrée est libre",
  "create.chip.choose": "Choisis une option",
  "create.chip.placeIn": "à {place}",
  "create.chip.pricePlus": "{first} +{rest} de plus",
  "create.artists.title": "Artistes et logos",
  "create.artists.optional": "(optionnel)",
  "create.cta": "Générer flyer",
  "create.ctaSoon": "Générer flyer · Bientôt",
  "create.soonNote": "Cette fonctionnalité sera bientôt disponible.",
  "create.soonTooltip": "Cette fonctionnalité sera bientôt disponible.",
  "create.footer": "Fond généré sans texte · Tout est éditable ensuite",
  // Editor
  "editor.tool.design": "Design",
  "editor.tool.text": "Texte",
  "editor.tool.elements": "Éléments",
  "editor.tool.photos": "Photos",
  "editor.tool.background": "Fond",
  "editor.tool.layers": "Calques",
  "editor.tool.ai": "IA Tools",
  "editor.tool.brand": "Brand Kit",
  "editor.tool.favorites": "Favoris",
  "editor.tool.comingSoon": "bientôt",
  "editor.action.undo": "Annuler",
  "editor.action.redo": "Rétablir",
  "editor.action.save": "Enregistrer brouillon (Supabase)",
  "editor.action.download": "Télécharger",
  "editor.action.share": "Partager",
  "editor.action.shareSoon": "Partager (bientôt)",
  "editor.action.saveDraft": "Enregistrer",
  "editor.action.exporting": "Export en cours…",
  "editor.fab.edit": "Éditer",
  "editor.fab.image": "Image",
  "editor.fab.imageTitle": "Ajouter image",
  "editor.fab.styles": "Styles",
  "editor.fab.stylesTitle": "Ouvrir le panneau styles",
  "editor.fab.align": "Aligner",
  "editor.fab.alignTitle": "Aligner",
  "editor.fab.lock": "Verrouiller",
  "editor.fab.unlock": "Déverr.",
  "editor.fab.delete": "Supprimer",
  "editor.fab.more": "Plus d'options",
  "editor.fab.duplicate": "Dupliquer",
  "editor.fab.layerUp": "Calque haut",
  "editor.fab.layerDown": "Calque bas",
  "editor.fab.flipH": "Miroir H",
  "editor.fab.flipV": "Miroir V",
  "editor.align.left": "Gau",
  "editor.align.centerH": "C·H",
  "editor.align.right": "Dro",
  "editor.align.top": "Haut",
  "editor.align.centerV": "C·V",
  "editor.align.bottom": "Bas",
  "editor.layerName.image": "Image",
  "editor.layerName.rect": "Rectangle",
  "editor.layerName.circle": "Cercle",
  "editor.layerName.triangle": "Triangle",
  "editor.layerName.line": "Ligne",
  "editor.layerName.star": "Étoile",
  "editor.layerName.hexagon": "Hexagone",
  "editor.layerName.arrow": "Flèche",
  "editor.layerName.frame": "Cadre",
  "editor.layerName.text": "Texte",
  "editor.fallback.title": "Éditeur",
  "editor.deleteLayer": "Supprimer calque",
  // ── MOBILE EDITOR V3 ──
  "mobileEditor.header.back": "Retour",
  "mobileEditor.header.undo": "Annuler",
  "mobileEditor.header.redo": "Rétablir",
  "mobileEditor.header.save": "Enregistrer les modifications",
  "mobileEditor.header.saveShort": "Enregistrer",
  "mobileEditor.header.saveNew": "Enregistrer un nouveau design",
  "mobileEditor.header.more": "Plus",
  "mobileEditor.header.export": "Exporter",
  "mobileEditor.header.loading": "Chargement…",
  "mobileEditor.header.renameLabel": "Renommer le flyer",
  "mobileEditor.header.renameTitle": "Touchez pour renommer",
  "mobileEditor.header.renamePromptName": "Nom du flyer",
  "mobileEditor.state.saved": "Enregistré",
  "mobileEditor.state.saving": "Enregistrement…",
  "mobileEditor.state.unsaved": "Non enregistré",
  "mobileEditor.bottomBar.templates": "Modèles",
  "mobileEditor.bottomBar.add": "Ajouter",
  "mobileEditor.bottomBar.photo": "Photo",
  "mobileEditor.bottomBar.style": "Style",
  "mobileEditor.bottomBar.remix": "Remix",
  "mobileEditor.confirm.exitUnsaved": "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?",
  "mobileEditor.confirm.resetTemplate": "Restaurer le design original ?\n\nToutes les modifications non enregistrées seront perdues.",
  "mobileEditor.confirm.changeFormatUnsaved": "Vous avez des modifications non enregistrées. Changer de format quand même ? Elles seront perdues.",
  "mobileEditor.toast.savedOk": "Design enregistré",
  "mobileEditor.toast.savedFail": "Impossible d'enregistrer",
  "mobileEditor.toast.savedError": "Erreur lors de l'enregistrement",
  "mobileEditor.toast.loginToSave": "Connectez-vous pour enregistrer",
  "mobileEditor.toast.loginToDownload": "Connectez-vous pour télécharger",
  "mobileEditor.toast.loginToUseAI": "Connectez-vous pour utiliser l'IA",
  "mobileEditor.fab.edit": "Modifier",
  "mobileEditor.fab.layerUp": "Avancer",
  "mobileEditor.fab.layerDown": "Reculer",
  "mobileEditor.fab.duplicate": "Dupliquer",
  "mobileEditor.fab.centerCanvas": "Centrer sur le canevas",
  "mobileEditor.fab.lock": "Verrouiller",
  "mobileEditor.fab.unlock": "Déverrouiller",
  "mobileEditor.fab.delete": "Supprimer",
  "mobileEditor.fab.done": "Terminé",
  "mobileEditor.toast.objectLocked": "Objet verrouillé",
  "mobileEditor.toast.objectUnlocked": "Objet déverrouillé",
  "mobileEditor.toast.centeredCanvas": "Centré sur le canevas",
  "mobileEditor.subtool.edit": "Éditer",
  "mobileEditor.subtool.font": "Police",
  "mobileEditor.subtool.styles": "Styles",
  "mobileEditor.subtool.size": "Taille",
  "mobileEditor.subtool.color": "Couleur",
  "mobileEditor.subtool.replace": "Remplacer",
  "mobileEditor.subtool.crop": "Recadrer",
  "mobileEditor.subtool.filters": "Filtres",
  "mobileEditor.subtool.removeBg": "Supp. fond",
  "mobileEditor.subtool.opacity": "Opacité",
  "mobileEditor.subtool.border": "Bordure",
  "mobileEditor.subtool.corners": "Coins",
  "mobileEditor.text.shadow": "Ombre",
  "mobileEditor.text.shadowActive": "Active",
  "mobileEditor.text.shadowNone": "Aucune",
  "mobileEditor.text.shadowSoft": "Douce",
  "mobileEditor.text.shadowStrong": "Forte",
  "mobileEditor.text.shadowGlow": "Halo",
  "mobileEditor.text.outline": "Contour texte",
  "mobileEditor.text.lineHeight": "Interligne",
  "mobileEditor.text.charSpacing": "Espacement",
  "mobileEditor.text.bold": "Gras",
  "mobileEditor.text.italic": "Italique",
  "mobileEditor.text.underline": "Souligné",
  "mobileEditor.text.alignLeft": "Aligner à gauche",
  "mobileEditor.text.alignCenter": "Centrer",
  "mobileEditor.text.alignRight": "Aligner à droite",
  "mobileEditor.text.reset": "Réinitialiser le format",
  "mobileEditor.text.fontSizeLabel": "Taille",
  "mobileEditor.crop.square": "Carré",
  "mobileEditor.crop.rounded": "Arrondi",
  "mobileEditor.crop.circle": "Cercle",
  "mobileEditor.filters.presets": "Préréglages",
  "mobileEditor.filters.original": "Original",
  "mobileEditor.filters.bw": "N&B",
  "mobileEditor.filters.warm": "Chaud",
  "mobileEditor.filters.cool": "Froid",
  "mobileEditor.filters.vintage": "Vintage",
  "mobileEditor.filters.fineAdjust": "Ajustement fin",
  "mobileEditor.filters.brightness": "Luminosité",
  "mobileEditor.filters.contrast": "Contraste",
  "mobileEditor.filters.saturation": "Saturation",
  "mobileEditor.filters.rotateFlip": "Tourner / retourner",
  "mobileEditor.filters.rotation": "Rotation",
  "mobileEditor.filters.flipH": "↔ Horizontal",
  "mobileEditor.filters.flipV": "↕ Vertical",
  "mobileEditor.toast.flippedH": "Retournée horizontalement",
  "mobileEditor.toast.flippedV": "Retournée verticalement",
  "mobileEditor.removeBg.title": "Supprimer le fond avec l'IA",
  "mobileEditor.removeBg.desc": "BRIA détecte automatiquement le sujet et supprime le fond. Fonctionne mieux avec des photos de personnes ou d'objets centrés.",
  "mobileEditor.removeBg.loadingTitle": "Suppression du fond…",
  "mobileEditor.removeBg.loadingDesc": "Cela prend 2-4 secondes. Ne fermez pas l'application.",
  "mobileEditor.removeBg.button": "Supprimer le fond",
  "mobileEditor.removeBg.buttonLoading": "Traitement…",
  "mobileEditor.toast.bgRemoved": "Fond supprimé",
  "mobileEditor.toast.bgFailed": "L'IA a échoué — réessayez",
  "mobileEditor.toast.selectImageFirst": "Sélectionnez d'abord une image",
  "mobileEditor.toast.imageError": "Erreur de traitement",
  "mobileEditor.replace.button": "Choisir une image de votre galerie",
  "mobileEditor.replace.hint": "La position et la taille actuelles sont conservées",
  "mobileEditor.toast.imageReplaced": "Image remplacée",
  "mobileEditor.toast.imageLoadError": "Impossible de charger l'image",
  "mobileEditor.border.thickness": "Épaisseur",
  "mobileEditor.border.remove": "Supprimer la bordure",
  "mobileEditor.corners.label": "Coins",
  "mobileEditor.corners.onlyRect": "Les coins arrondis ne s'appliquent qu'aux rectangles.",
  "mobileEditor.aria.colorSwatch": "Couleur",
  "mobileEditor.aria.borderColor": "Couleur bordure",
  "mobileEditor.toast.textAdded": "Texte ajouté",
  "mobileEditor.toast.shapeAdded": "Forme ajoutée",
  "mobileEditor.toast.imageAdded": "Image ajoutée",
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
  // /projects
  "projects.title": "Meus flyers",
  "projects.subtitle.one": "{n} projeto guardado",
  "projects.subtitle.many": "{n} projetos guardados",
  "projects.newFlyer": "Novo flyer",
  "projects.loginRequired.title": "Inicia sessão para ver os teus flyers",
  "projects.loginRequired.body": "Guarda e acede a todos os teus designs de qualquer dispositivo.",
  "projects.loginRequired.cta": "Ir para o início",
  "projects.empty.title": "Ainda não tens flyers guardados",
  "projects.empty.body": "Cria o teu primeiro flyer e guarda-o para aceder de qualquer dispositivo.",
  "projects.empty.cta": "Explorar modelos",
  "projects.card.editAria": "Editar",
  "projects.card.deleteAria": "Eliminar",
  "projects.card.edit": "Editar",
  "projects.confirmDelete": "Eliminar este projeto?",
  // /history
  "history.title": "Histórico",
  "history.body": "Aqui aparecerá o histórico de gerações e exportações.",
  // /colaboradores
  "collab.title": "Colaboradores",
  "collab.subtitle": "Pessoas e marcas que aparecem nos teus flyers",
  "collab.invite": "Convidar colaborador",
  "collab.tab.people": "Pessoas",
  "collab.tab.brands": "Marcas",
  "collab.search.people": "Procurar pessoas…",
  "collab.search.brands": "Procurar marcas…",
  "collab.sort.recent": "Mais recentes",
  "collab.sort.alpha": "Alfabético",
  "collab.sort.recentShort": "Recentes",
  "collab.sort.alphaShort": "A-Z",
  "collab.empty.noResults": "Sem resultados para a tua pesquisa",
  "collab.empty.people.title": "Sem pessoas ainda",
  "collab.empty.brands.title": "Sem marcas ainda",
  "collab.empty.people.body": "Convida artistas, professores ou oradores para se registarem",
  "collab.empty.brands.body": "Convida patrocinadores ou empresas parceiras",
  "collab.card.editBrand": "Editar marca",
  "collab.card.editRole": "Editar função",
  "collab.card.askUpdate": "Pedir atualização",
  "collab.card.delete": "Eliminar",
  "collab.modal.editBrand.title": "Editar marca",
  "collab.modal.editRole.title": "Editar função",
  "collab.modal.editBrand.body": "Podes editar o nome e função da marca.",
  "collab.modal.editRole.body": "Só podes editar a função (etiqueta interna). Para mudar nome/telefone/foto, usa 'Pedir atualização'.",
  "collab.modal.name": "Nome",
  "collab.modal.role": "Função",
  "collab.modal.optional": "(opcional)",
  "collab.modal.role.placeholderBrand": "Ex: Patrocinador oficial",
  "collab.modal.role.placeholderPerson": "Ex: DJ, Professor",
  "collab.modal.gdprNotice": "Pelo RGPD não podes modificar nome, telefone ou foto de uma pessoa sem o consentimento dela. Usa \"Pedir atualização\" no menu para lhe enviar um novo link.",
  "collab.modal.saving": "A guardar…",
  "collab.modal.save": "Guardar",
  "collab.invite.title": "Convidar colaborador",
  "collab.invite.body": "Partilha este link. O colaborador decidirá se é pessoa ou marca ao abrir.",
  "collab.invite.linkLabel": "Link único · expira em 7 dias",
  "collab.invite.copied": "Copiado",
  "collab.invite.copy": "Copiar",
  "collab.invite.whatsapp": "WhatsApp",
  "collab.invite.whatsappMessage": "Olá! Partilho um link para registares os teus dados como colaborador no próximo evento:\n\n{url}\n\nExpira em 7 dias.",
  "collab.reinvite.title": "Pedir atualização",
  "collab.reinvite.body": "Partilha este link com {name} para que atualize os seus dados.",
  "collab.reinvite.whatsappMessage": "Olá {name}, podes atualizar os teus dados? Aqui tens o link (expira em 7 dias):\n\n{url}",
  "collab.delete.title": "Eliminar {name}?",
  "collab.delete.body": "Esta ação é permanente. A foto e todos os seus dados serão eliminados definitivamente.",
  "collab.delete.cancel": "Cancelar",
  "collab.delete.confirm": "Eliminar",
  "collab.delete.deleting": "A eliminar…",
  "collab.error.load": "Erro a carregar",
  "collab.error.unknown": "Erro desconhecido",
  "collab.error.invite": "Erro a gerar convite",
  "collab.error.save": "Erro a guardar",
  "collab.error.reinvite": "Erro a gerar link",
  "collab.error.delete": "Erro a eliminar",
  // /admin/templates
  "admin.tpl.title": "Admin · Modelos",
  "admin.tpl.internal": "INTERNO",
  "admin.tpl.subtitle": "{n} modelos no catálogo · Tags só visíveis aqui",
  "admin.tpl.newTemplate": "✦ Criar novo modelo",
  "admin.tpl.discard": "Descartar",
  "admin.tpl.viewChanges": "Ver mudanças",
  "admin.tpl.search.placeholder": "Procurar por título, categoria ou id…",
  "admin.tpl.sort.newFirst": "Novos primeiro",
  "admin.tpl.sort.oldFirst": "Antigos primeiro",
  "admin.tpl.filter.all": "Todos",
  "admin.tpl.filter.untagged": "Sem tag",
  "admin.tpl.empty": "Sem resultados com esses filtros",
  "admin.tpl.modified": "MODIFICADO",
  "admin.tpl.variants": "variante(s)",
  "admin.tpl.premium": "Premium",
  "admin.tpl.internalTags": "Tags internos",
  "admin.tpl.pagination.showing": "A mostrar",
  "admin.tpl.pagination.of": "de",
  "admin.tpl.pagination.prev": "Página anterior",
  "admin.tpl.pagination.next": "Página seguinte",
  "admin.tpl.diff.title.one": "{n} mudança pendente",
  "admin.tpl.diff.title.many": "{n} mudanças pendentes",
  "admin.tpl.diff.subtitle": "Copia este fragmento e cola-o em data/templates.ts em cada modelo",
  "admin.tpl.diff.noTags": "(sem tags)",
  "admin.tpl.diff.warning": "Estas mudanças NÃO são guardadas automaticamente. Tens de as colar em data/templates.ts e fazer commit. Se atualizares esta página, perde-las.",
  "admin.tpl.diff.copy": "Copiar fragmento TypeScript",
  "admin.tpl.diff.copied": "Copiado para área de transferência",
  // /admin/templates/new
  "admin.new.title": "Criador de modelos",
  "admin.new.subtitle": "Cria rascunhos e publica-os no catálogo",
  "admin.new.create": "Novo modelo",
  "admin.new.creating": "A criar...",
  "admin.new.createShort": "Novo",
  "admin.new.tab.drafts": "Rascunhos",
  "admin.new.tab.published": "Publicados",
  "admin.new.drafts.empty.title": "Sem rascunhos",
  "admin.new.drafts.empty.body": "Cria o teu primeiro modelo com o botão \"Novo modelo\".",
  "admin.new.published.empty.title": "Ainda não publicaste modelos",
  "admin.new.published.empty.body": "Termina um rascunho e clica em \"Publicar\" para aparecer no catálogo.",
  "admin.new.draft.status.draft": "Rascunho",
  "admin.new.draft.status.ready": "Pronto",
  "admin.new.draft.status.archived": "Arquivado",
  "admin.new.published.status": "Publicado",
  "admin.new.card.delete": "Eliminar rascunho",
  "admin.new.card.unpublish": "Despublicar",
  "admin.new.card.edit": "Editar",
  "admin.new.confirm.delete": "Eliminar rascunho \"{title}\"?",
  "admin.new.confirm.unpublish": "Despublicar \"{title}\"? Deixará de aparecer em /templates.",
  "admin.new.error.editPublished": "Não foi possível abrir o modelo para editar.",
  "admin.new.firstTemplate.title": "Novo modelo",
  "admin.new.firstTemplate.untitled": "Modelo sem título",
  "admin.new.firstTemplate.cat": "Outros",
  // /create
  "create.examples.0": "Cria um flyer para um concerto com 2 artistas…",
  "create.examples.1": "Desenha um cartaz para uma festa este sábado…",
  "create.examples.2": "Faz um flyer com néon roxo e dourado…",
  "create.examples.3": "Festival com 10 artistas e entrada premium…",
  "create.chips.0": "Festa este sábado",
  "create.chips.1": "Concerto ao vivo",
  "create.chips.2": "Festival ao ar livre",
  "create.chips.3": "Aula aberta",
  "create.gen.title": "A criar o teu flyer",
  "create.gen.step.analyze": "A analisar o teu evento...",
  "create.gen.step.bg": "A gerar fundo premium...",
  "create.gen.step.artists": "A processar artistas...",
  "create.gen.step.preview": "A compor preview...",
  "create.gen.label.analyze": "A analisar evento",
  "create.gen.label.bg": "A gerar fundo premium",
  "create.gen.label.artists": "A processar artistas",
  "create.gen.label.preview": "A compor preview",
  "create.gen.footnote": "O fundo é gerado sem texto — o texto é adicionado como camada editável",
  "create.gen.error": "Erro",
  "create.gen.error.unknown": "desconhecido",
  "create.badge.soon": "Em breve",
  "create.title.line1": "Desenha flyers que",
  "create.title.highlight": "impactam",
  "create.sub.admin.lead": "Descreve o teu evento e a ",
  "create.sub.admin.ai": "IA",
  "create.sub.admin.tail": " gera o flyer perfeito.",
  "create.sub.guest.lead": "Geração com IA em breve. Entretanto, ",
  "create.sub.guest.link": "explora os nossos modelos",
  "create.sub.guest.tail": ".",
  "create.chip.date": "Data",
  "create.chip.time": "Hora",
  "create.chip.timeFixed": "Hora fixa",
  "create.chip.timeRange": "Intervalo de horas",
  "create.chip.from": "Desde",
  "create.chip.to": "Até",
  "create.chip.timeFromShort": "Desde {time}",
  "create.chip.timeToShort": "Até {time}",
  "create.chip.timePlaceholder": "Ex: 22:00",
  "create.chip.fromPlaceholder": "22:00",
  "create.chip.toPlaceholder": "06:00",
  "create.chip.timeEmpty": "Escolhe uma opção",
  "create.chip.place": "Local",
  "create.chip.venue": "Sala",
  "create.chip.city": "Cidade",
  "create.chip.venuePlaceholder": "Ex: Sala Tejo",
  "create.chip.cityPlaceholder": "Ex: Lisboa",
  "create.chip.price": "Preço",
  "create.chip.priceFree": "Entrada livre",
  "create.chip.pricePaid": "Com preço",
  "create.chip.priceLabel": "Etiqueta",
  "create.chip.priceAmount": "8€",
  "create.chip.priceAdd": "+ Adicionar preço",
  "create.chip.priceRemove": "Eliminar preço",
  "create.chip.priceFreeNote": "O flyer indicará que a entrada é livre",
  "create.chip.choose": "Escolhe uma opção",
  "create.chip.placeIn": "em {place}",
  "create.chip.pricePlus": "{first} +{rest} mais",
  "create.artists.title": "Artistas e logos",
  "create.artists.optional": "(opcional)",
  "create.cta": "Gerar flyer",
  "create.ctaSoon": "Gerar flyer · Em breve",
  "create.soonNote": "Esta função estará disponível em breve.",
  "create.soonTooltip": "Esta função estará disponível em breve.",
  "create.footer": "O fundo é gerado sem texto · Tudo é editável depois",
  // Editor
  "editor.tool.design": "Design",
  "editor.tool.text": "Texto",
  "editor.tool.elements": "Elementos",
  "editor.tool.photos": "Fotos",
  "editor.tool.background": "Fundo",
  "editor.tool.layers": "Camadas",
  "editor.tool.ai": "IA Tools",
  "editor.tool.brand": "Brand Kit",
  "editor.tool.favorites": "Favoritos",
  "editor.tool.comingSoon": "em breve",
  "editor.action.undo": "Anular",
  "editor.action.redo": "Refazer",
  "editor.action.save": "Guardar rascunho (Supabase)",
  "editor.action.download": "Descarregar",
  "editor.action.share": "Partilhar",
  "editor.action.shareSoon": "Partilhar (em breve)",
  "editor.action.saveDraft": "Guardar",
  "editor.action.exporting": "A exportar…",
  "editor.fab.edit": "Editar",
  "editor.fab.image": "Imagem",
  "editor.fab.imageTitle": "Adicionar imagem",
  "editor.fab.styles": "Estilos",
  "editor.fab.stylesTitle": "Abrir painel de estilos",
  "editor.fab.align": "Alinhar",
  "editor.fab.alignTitle": "Alinhar",
  "editor.fab.lock": "Bloquear",
  "editor.fab.unlock": "Desblq.",
  "editor.fab.delete": "Eliminar",
  "editor.fab.more": "Mais opções",
  "editor.fab.duplicate": "Duplicar",
  "editor.fab.layerUp": "Subir camada",
  "editor.fab.layerDown": "Descer camada",
  "editor.fab.flipH": "Espelhar H",
  "editor.fab.flipV": "Espelhar V",
  "editor.align.left": "Esq",
  "editor.align.centerH": "C·H",
  "editor.align.right": "Dir",
  "editor.align.top": "Cima",
  "editor.align.centerV": "C·V",
  "editor.align.bottom": "Baixo",
  "editor.layerName.image": "Imagem",
  "editor.layerName.rect": "Retângulo",
  "editor.layerName.circle": "Círculo",
  "editor.layerName.triangle": "Triângulo",
  "editor.layerName.line": "Linha",
  "editor.layerName.star": "Estrela",
  "editor.layerName.hexagon": "Hexágono",
  "editor.layerName.arrow": "Seta",
  "editor.layerName.frame": "Moldura",
  "editor.layerName.text": "Texto",
  "editor.fallback.title": "Editor",
  "editor.deleteLayer": "Eliminar camada",
  // ── MOBILE EDITOR V3 ──
  "mobileEditor.header.back": "Voltar",
  "mobileEditor.header.undo": "Desfazer",
  "mobileEditor.header.redo": "Refazer",
  "mobileEditor.header.save": "Guardar alterações",
  "mobileEditor.header.saveShort": "Guardar",
  "mobileEditor.header.saveNew": "Guardar novo design",
  "mobileEditor.header.more": "Mais",
  "mobileEditor.header.export": "Exportar",
  "mobileEditor.header.loading": "A carregar…",
  "mobileEditor.header.renameLabel": "Renomear flyer",
  "mobileEditor.header.renameTitle": "Toque para renomear",
  "mobileEditor.header.renamePromptName": "Nome do flyer",
  "mobileEditor.state.saved": "Guardado",
  "mobileEditor.state.saving": "A guardar…",
  "mobileEditor.state.unsaved": "Não guardado",
  "mobileEditor.bottomBar.templates": "Modelos",
  "mobileEditor.bottomBar.add": "Adicionar",
  "mobileEditor.bottomBar.photo": "Foto",
  "mobileEditor.bottomBar.style": "Estilo",
  "mobileEditor.bottomBar.remix": "Remix",
  "mobileEditor.confirm.exitUnsaved": "Tem alterações não guardadas. Tem a certeza que deseja sair?",
  "mobileEditor.confirm.resetTemplate": "Restaurar o design original?\n\nPerderá todas as alterações não guardadas.",
  "mobileEditor.confirm.changeFormatUnsaved": "Tem alterações não guardadas. Mudar de formato mesmo assim? Serão perdidas.",
  "mobileEditor.toast.savedOk": "Design guardado",
  "mobileEditor.toast.savedFail": "Não foi possível guardar",
  "mobileEditor.toast.savedError": "Erro ao guardar",
  "mobileEditor.toast.loginToSave": "Inicie sessão para guardar",
  "mobileEditor.toast.loginToDownload": "Inicie sessão para descarregar",
  "mobileEditor.toast.loginToUseAI": "Inicie sessão para usar a IA",
  "mobileEditor.fab.edit": "Editar",
  "mobileEditor.fab.layerUp": "Avançar",
  "mobileEditor.fab.layerDown": "Recuar",
  "mobileEditor.fab.duplicate": "Duplicar",
  "mobileEditor.fab.centerCanvas": "Centrar no canvas",
  "mobileEditor.fab.lock": "Bloquear",
  "mobileEditor.fab.unlock": "Desbloquear",
  "mobileEditor.fab.delete": "Apagar",
  "mobileEditor.fab.done": "Pronto",
  "mobileEditor.toast.objectLocked": "Objeto bloqueado",
  "mobileEditor.toast.objectUnlocked": "Objeto desbloqueado",
  "mobileEditor.toast.centeredCanvas": "Centrado no canvas",
  "mobileEditor.subtool.edit": "Editar",
  "mobileEditor.subtool.font": "Fonte",
  "mobileEditor.subtool.styles": "Estilos",
  "mobileEditor.subtool.size": "Tamanho",
  "mobileEditor.subtool.color": "Cor",
  "mobileEditor.subtool.replace": "Substituir",
  "mobileEditor.subtool.crop": "Recortar",
  "mobileEditor.subtool.filters": "Filtros",
  "mobileEditor.subtool.removeBg": "Remover fundo",
  "mobileEditor.subtool.opacity": "Opacidade",
  "mobileEditor.subtool.border": "Contorno",
  "mobileEditor.subtool.corners": "Cantos",
  "mobileEditor.text.shadow": "Sombra",
  "mobileEditor.text.shadowActive": "Ativa",
  "mobileEditor.text.shadowNone": "Nenhuma",
  "mobileEditor.text.shadowSoft": "Suave",
  "mobileEditor.text.shadowStrong": "Forte",
  "mobileEditor.text.shadowGlow": "Brilho",
  "mobileEditor.text.outline": "Contorno texto",
  "mobileEditor.text.lineHeight": "Espaçamento linha",
  "mobileEditor.text.charSpacing": "Espaçamento letras",
  "mobileEditor.text.bold": "Negrito",
  "mobileEditor.text.italic": "Itálico",
  "mobileEditor.text.underline": "Sublinhado",
  "mobileEditor.text.alignLeft": "Alinhar à esquerda",
  "mobileEditor.text.alignCenter": "Centrar",
  "mobileEditor.text.alignRight": "Alinhar à direita",
  "mobileEditor.text.reset": "Repor formato",
  "mobileEditor.text.fontSizeLabel": "Tamanho",
  "mobileEditor.crop.square": "Quadrado",
  "mobileEditor.crop.rounded": "Arredondado",
  "mobileEditor.crop.circle": "Círculo",
  "mobileEditor.filters.presets": "Predefinições",
  "mobileEditor.filters.original": "Original",
  "mobileEditor.filters.bw": "P&B",
  "mobileEditor.filters.warm": "Quente",
  "mobileEditor.filters.cool": "Frio",
  "mobileEditor.filters.vintage": "Vintage",
  "mobileEditor.filters.fineAdjust": "Ajuste fino",
  "mobileEditor.filters.brightness": "Brilho",
  "mobileEditor.filters.contrast": "Contraste",
  "mobileEditor.filters.saturation": "Saturação",
  "mobileEditor.filters.rotateFlip": "Rodar / virar",
  "mobileEditor.filters.rotation": "Rotação",
  "mobileEditor.filters.flipH": "↔ Horizontal",
  "mobileEditor.filters.flipV": "↕ Vertical",
  "mobileEditor.toast.flippedH": "Virado horizontalmente",
  "mobileEditor.toast.flippedV": "Virado verticalmente",
  "mobileEditor.removeBg.title": "Remover fundo com IA",
  "mobileEditor.removeBg.desc": "A BRIA deteta o sujeito automaticamente e remove o fundo. Funciona melhor com fotos de pessoas ou objetos centrados.",
  "mobileEditor.removeBg.loadingTitle": "A remover fundo…",
  "mobileEditor.removeBg.loadingDesc": "Isto demora 2-4 segundos. Não feche a aplicação.",
  "mobileEditor.removeBg.button": "Remover fundo agora",
  "mobileEditor.removeBg.buttonLoading": "A processar…",
  "mobileEditor.toast.bgRemoved": "Fundo removido",
  "mobileEditor.toast.bgFailed": "A IA falhou — tente novamente",
  "mobileEditor.toast.selectImageFirst": "Selecione primeiro uma imagem",
  "mobileEditor.toast.imageError": "Erro ao processar a imagem",
  "mobileEditor.replace.button": "Escolher imagem da galeria",
  "mobileEditor.replace.hint": "A posição e o tamanho atuais são mantidos",
  "mobileEditor.toast.imageReplaced": "Imagem substituída",
  "mobileEditor.toast.imageLoadError": "Não foi possível carregar a imagem",
  "mobileEditor.border.thickness": "Espessura",
  "mobileEditor.border.remove": "Remover contorno",
  "mobileEditor.corners.label": "Cantos",
  "mobileEditor.corners.onlyRect": "Os cantos arredondados só se aplicam a retângulos.",
  "mobileEditor.aria.colorSwatch": "Cor",
  "mobileEditor.aria.borderColor": "Cor contorno",
  "mobileEditor.toast.textAdded": "Texto adicionado",
  "mobileEditor.toast.shapeAdded": "Forma adicionada",
  "mobileEditor.toast.imageAdded": "Imagem adicionada",
};

export const TRANSLATIONS: Record<Locale, Dict> = { es, en, fr, pt };
