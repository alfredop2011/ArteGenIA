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
  | "home.hero.title.rotating"
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
  | "nav.pricing"
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
  | "auth.error.confirmationTimeout"
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
  | "mobileEditor.toast.imageAdded"
  // ── SHEET TITLES (Fase P.3) ──
  | "mobileEditor.sheet.photo"
  | "mobileEditor.sheet.style"
  | "mobileEditor.sheet.remix"
  | "mobileEditor.sheet.more"
  | "mobileEditor.sheet.export"
  | "mobileEditor.sheet.add"
  | "mobileEditor.sheet.layers"
  | "mobileEditor.sheet.format"
  | "mobileEditor.sheet.assistant"
  // ── SHEET PHOTO ──
  | "mobileEditor.photo.flyerPhotos"
  | "mobileEditor.photo.noPhotos"
  | "mobileEditor.photo.tapToEdit"
  | "mobileEditor.photo.uploadNew"
  | "mobileEditor.photo.uploadHint"
  | "mobileEditor.toast.photoAddedFailed"
  // ── SHEET STYLE (paletas) ──
  | "mobileEditor.style.palettesFor"
  | "mobileEditor.toast.paletteApplied"
  // ── SHEET REMIX ──
  | "mobileEditor.remix.intro"
  | "mobileEditor.remix.generateAI"
  | "mobileEditor.remix.beta"
  | "mobileEditor.remix.surprise"
  | "mobileEditor.remix.neon"
  | "mobileEditor.remix.elegant"
  | "mobileEditor.remix.vintage"
  | "mobileEditor.remix.curatedStyles"
  | "mobileEditor.remix.applied"
  | "mobileEditor.toast.styleApplied"
  | "mobileEditor.toast.remixError"
  | "mobileEditor.toast.rateLimitWait"
  // ── SHEET MORE ──
  | "mobileEditor.more.myFlyers"
  | "mobileEditor.more.myFlyersSub"
  | "mobileEditor.more.viewTutorial"
  | "mobileEditor.more.viewTutorialSub"
  | "mobileEditor.more.layers"
  | "mobileEditor.more.layersSub"
  | "mobileEditor.more.aiAssistant"
  | "mobileEditor.more.aiAssistantSub"
  | "mobileEditor.more.changeFormat"
  | "mobileEditor.more.changeFormatSub"
  | "mobileEditor.more.resetTemplate"
  | "mobileEditor.more.resetTemplateSub"
  | "mobileEditor.more.comingSoon"
  // ── SHEET EXPORT ──
  | "mobileEditor.export.fileType"
  | "mobileEditor.export.png"
  | "mobileEditor.export.jpg"
  | "mobileEditor.export.pdf"
  | "mobileEditor.export.svg"
  | "mobileEditor.export.pngSubtitle"
  | "mobileEditor.export.jpgSubtitle"
  | "mobileEditor.export.pdfSubtitle"
  | "mobileEditor.export.svgSubtitle"
  | "mobileEditor.export.pngHelp"
  | "mobileEditor.export.jpgHelp"
  | "mobileEditor.export.pdfHelp"
  | "mobileEditor.export.svgHelp"
  | "mobileEditor.export.templateHas"
  | "mobileEditor.export.textsMaintained"
  | "mobileEditor.export.edited"
  | "mobileEditor.export.download"
  | "mobileEditor.export.downloadAll"
  | "mobileEditor.export.exporting"
  | "mobileEditor.export.notice"
  | "mobileEditor.toast.downloaded"
  | "mobileEditor.toast.downloadedSvg"
  | "mobileEditor.toast.downloadedPdf"
  | "mobileEditor.toast.exportError"
  | "mobileEditor.toast.allDownloaded"
  // ── SHARE MODAL ──
  | "mobileEditor.share.title"
  | "mobileEditor.share.downloadedOk"
  | "mobileEditor.share.systemShare"
  | "mobileEditor.share.orChoose"
  | "mobileEditor.share.whatsapp"
  | "mobileEditor.share.instagram"
  | "mobileEditor.share.facebook"
  | "mobileEditor.share.twitter"
  | "mobileEditor.share.telegram"
  | "mobileEditor.share.email"
  | "mobileEditor.share.copyLink"
  | "mobileEditor.share.copied"
  | "mobileEditor.share.redownload"
  | "mobileEditor.share.privateUrl"
  | "mobileEditor.share.message"
  | "mobileEditor.share.credit"
  | "mobileEditor.share.igTitle"
  | "mobileEditor.share.igIntro"
  | "mobileEditor.share.igStep1"
  | "mobileEditor.share.igStep2"
  | "mobileEditor.share.igStep3"
  | "mobileEditor.share.igOpen"
  | "mobileEditor.share.close"
  | "mobileEditor.toast.shareUploadFailed"
  | "mobileEditor.toast.loginToShare"
  // ── SHEET LAYERS ──
  | "mobileEditor.layers.intro"
  | "mobileEditor.layers.empty"
  | "mobileEditor.layers.emptyHint"
  | "mobileEditor.layers.aria.up"
  | "mobileEditor.layers.aria.down"
  | "mobileEditor.layers.aria.show"
  | "mobileEditor.layers.aria.hide"
  | "mobileEditor.layers.fallback.text"
  | "mobileEditor.layers.fallback.image"
  | "mobileEditor.layers.fallback.rect"
  | "mobileEditor.layers.fallback.circle"
  | "mobileEditor.layers.fallback.triangle"
  | "mobileEditor.layers.fallback.shape"
  // ── SHEET CHANGE FORMAT ──
  | "mobileEditor.changeFormat.intro"
  | "mobileEditor.changeFormat.current"
  | "mobileEditor.changeFormat.noVariant"
  // ── SHEET ADD ELEMENT ──
  | "mobileEditor.add.textSection"
  | "mobileEditor.add.shapesSection"
  | "mobileEditor.add.imageSection"
  | "mobileEditor.add.title"
  | "mobileEditor.add.subtitle"
  | "mobileEditor.add.body"
  | "mobileEditor.add.rect"
  | "mobileEditor.add.circle"
  | "mobileEditor.add.triangle"
  | "mobileEditor.add.heart"
  | "mobileEditor.add.star"
  | "mobileEditor.add.line"
  | "mobileEditor.add.uploadPhoto"
  | "mobileEditor.add.hint"
  // ── ASSISTANT SHEET ──
  | "mobileEditor.assistant.loginTitle"
  | "mobileEditor.assistant.loginDesc"
  | "mobileEditor.assistant.loginBtn"
  | "mobileEditor.assistant.loginFooter"
  | "mobileEditor.assistant.headerTitle"
  | "mobileEditor.assistant.headerDesc"
  | "mobileEditor.assistant.placeholder"
  | "mobileEditor.assistant.examples"
  | "mobileEditor.assistant.generating"
  | "mobileEditor.assistant.generate"
  | "mobileEditor.assistant.poweredBy"
  | "mobileEditor.assistant.previewTitle"
  | "mobileEditor.assistant.previewDesc"
  | "mobileEditor.assistant.retry"
  | "mobileEditor.assistant.apply"
  | "mobileEditor.assistant.emptyValue"
  | "mobileEditor.toast.assistantApplied"
  | "mobileEditor.toast.assistantError"
  | "mobileEditor.toast.assistantEmpty"
  | "mobileEditor.toast.assistantNeedPrompt"
  // ── ONBOARDING ──
  | "mobileEditor.onb.step1Title"
  | "mobileEditor.onb.step1Body"
  | "mobileEditor.onb.step2Title"
  | "mobileEditor.onb.step2Body"
  | "mobileEditor.onb.step3Title"
  | "mobileEditor.onb.step3Body"
  | "mobileEditor.onb.step4Title"
  | "mobileEditor.onb.step4Body"
  | "mobileEditor.onb.skip"
  | "mobileEditor.onb.next"
  | "mobileEditor.onb.start"
  // ── AGENDA EVENTOS ──
  | "eventos.cat.fiesta"
  | "eventos.cat.conciertos"
  | "eventos.cat.festival"
  | "eventos.cat.clases"
  | "eventos.cat.club"
  | "eventos.cat.corporativo"
  | "eventos.cat.social"
  | "eventos.cat.teatro"
  | "eventos.aud.academias"
  | "eventos.aud.productoras"
  | "eventos.aud.freelance"
  | "eventos.aud.instituciones"
  | "eventos.aud.agencias"
  | "eventos.aud.colegios"
  | "eventos.city.todas"
  | "eventos.date.todos"
  | "eventos.date.hoy"
  | "eventos.date.manana"
  | "eventos.date.finde"
  | "eventos.date.semana"
  | "eventos.date.mes"
  | "eventos.date.rango"
  | "eventos.topbar.brand"
  | "eventos.topbar.shareAria"
  | "eventos.topbar.shareCopied"
  | "eventos.topbar.share"
  | "eventos.topbar.publishShort"
  | "eventos.topbar.uploadShort"
  | "eventos.organizer.publish"
  | "eventos.organizer.uploadFree"
  | "eventos.hero.badge"
  | "eventos.hero.titleMobile"
  | "eventos.hero.titleDesktop"
  | "eventos.hero.subtitle"
  | "eventos.country.soon"
  | "eventos.search.placeholder"
  | "eventos.search.nearMe"
  | "eventos.geo.unsupported"
  | "eventos.geo.showing"
  | "eventos.geo.noneNearby"
  | "eventos.geo.failed"
  | "eventos.geo.errorPrompt"
  | "eventos.filters.free"
  | "eventos.filters.nearMe"
  | "eventos.filters.more"
  | "eventos.view.lista"
  | "eventos.view.calendario"
  | "eventos.filters.whenLabel"
  | "eventos.filters.categoryLabel"
  | "eventos.filters.audienceLabel"
  | "eventos.filters.saved"
  | "eventos.range.from"
  | "eventos.range.to"
  | "eventos.count.one"
  | "eventos.count.many"
  | "eventos.count.in"
  | "eventos.count.mockBadge"
  | "eventos.cityauto.placeholder"
  | "eventos.cityauto.empty"
  | "eventos.band.titleHas"
  | "eventos.band.titleOrg"
  | "eventos.band.descHas"
  | "eventos.band.descOrg"
  | "eventos.band.ctaHas"
  | "eventos.band.ctaOrg"
  | "eventos.auth.title"
  | "eventos.auth.subtitle"
  | "eventos.publish.titleHas"
  | "eventos.publish.titleOrg"
  | "eventos.publish.subtitle"
  | "eventos.publish.close"
  | "eventos.publish.web.title"
  | "eventos.publish.web.fast"
  | "eventos.publish.web.descHas"
  | "eventos.publish.web.descOrg"
  | "eventos.publish.telegram.title"
  | "eventos.publish.telegram.noAccount"
  | "eventos.publish.telegram.desc"
  | "eventos.publish.telegram.soonDesc"
  | "eventos.publish.whatsapp.title"
  | "eventos.publish.whatsapp.desc"
  | "eventos.publish.voice.title"
  | "eventos.publish.voice.desc"
  | "eventos.publish.soonBadge"
  | "eventos.list.today"
  | "eventos.list.seeAll"
  | "eventos.card.consult"
  | "eventos.card.free"
  | "eventos.card.priceFrom"
  | "eventos.card.removeFav"
  | "eventos.card.addFav"
  | "eventos.card.cancelled"
  | "eventos.card.tickets"
  | "eventos.card.seeEvent"
  | "eventos.cal.more"
  | "eventos.cal.legend"
  | "eventos.rsvp.join"
  | "eventos.rsvp.joined"
  | "eventos.rsvp.count"
  | "eventos.stats.week"
  | "eventos.stats.free"
  | "eventos.stats.attending"
  | "eventos.stats.summary"
  | "eventos.featured.title"
  | "eventos.featured.popular"
  | "eventos.featured.see"
  | "eventos.modal.seeFlyer"
  | "eventos.modal.priceTbc"
  | "eventos.modal.priceFree"
  | "eventos.modal.timeSuffix"
  | "eventos.modal.saved"
  | "eventos.modal.save"
  | "eventos.modal.copied"
  | "eventos.modal.share"
  | "eventos.modal.buyOnline"
  | "eventos.modal.freeEntry"
  | "eventos.modal.consultOrganizer"
  | "eventos.modal.boxOffice"
  | "eventos.lightbox.close"
  | "eventos.seal.cancelled"
  | "eventos.empty.title"
  | "eventos.empty.body"
  | "eventos.empty.reset"
  // ── PANEL ORGANIZADOR ──
  | "org.cat.fiesta"
  | "org.cat.conciertos"
  | "org.cat.festival"
  | "org.cat.clases"
  | "org.cat.club"
  | "org.cat.corporativo"
  | "org.cat.social"
  | "org.cat.teatro"
  | "org.aud.academias"
  | "org.aud.productoras"
  | "org.aud.freelance"
  | "org.aud.instituciones"
  | "org.aud.agencias"
  | "org.aud.colegios"
  | "org.claim.success"
  | "org.gate.titleClaim"
  | "org.gate.titlePublish"
  | "org.gate.bodyClaim"
  | "org.gate.bodyPublish"
  | "org.gate.signIn"
  | "org.gate.back"
  | "org.gate.authClaim"
  | "org.gate.authPublish"
  | "org.auth.subtitle"
  | "org.header.backLink"
  | "org.header.titleAdmin"
  | "org.header.titleMine"
  | "org.header.adminBadge"
  | "org.header.descAdmin"
  | "org.header.descMine"
  | "org.header.newEvent"
  | "org.loading"
  | "org.section.drafts"
  | "org.section.draftsHint"
  | "org.section.upcoming"
  | "org.section.upcomingHint"
  | "org.section.upcomingEmpty"
  | "org.section.past"
  | "org.section.pastHint"
  | "org.section.cancelled"
  | "org.section.cancelledHint"
  | "org.row.cancelShort"
  | "org.row.consult"
  | "org.row.free"
  | "org.row.series"
  | "org.row.anon"
  | "org.row.unpublish"
  | "org.row.publish"
  | "org.row.reactivate"
  | "org.row.markCancelled"
  | "org.row.edit"
  | "org.row.delete"
  | "org.delete.confirm"
  | "org.form.titleEdit"
  | "org.form.titleNew"
  | "org.form.errRequired"
  | "org.form.errUpload"
  | "org.form.errUploadGeneric"
  | "org.form.labelTitle"
  | "org.form.phTitle"
  | "org.form.labelDate"
  | "org.form.labelTime"
  | "org.form.labelCity"
  | "org.form.labelCategory"
  | "org.form.labelAudience"
  | "org.form.labelVenue"
  | "org.form.phVenue"
  | "org.form.labelNeighborhood"
  | "org.form.phNeighborhood"
  | "org.form.labelFlyer"
  | "org.form.uploading"
  | "org.form.changeFlyer"
  | "org.form.uploadFlyer"
  | "org.form.noFlyer"
  | "org.form.labelPrice"
  | "org.form.phPrice"
  | "org.form.labelPriceInfo"
  | "org.form.phPriceInfo"
  | "org.form.onlineSale"
  | "org.form.phTicketUrl"
  | "org.form.labelDescription"
  | "org.form.phDescription"
  | "org.form.saveDraft"
  | "org.form.publish"
  | "org.empty.title"
  | "org.empty.body"
  | "org.empty.create";

type Dict = Record<TranslationKey, string>;

const es: Dict = {
  "home.hero.title.line1": "Tu flyer profesional",
  "home.hero.title.line2": "con IA en 2 min para",
  "home.hero.title.highlight": "tu evento",
  "home.hero.title.rotating": "tu fiesta, tus conciertos, tu festival, tus clases de baile, tu discoteca, tu evento corporativo, tu academia, tu institución, tu colegio, tu productora, profesores particulares",
  "home.hero.subtitle": "Quita fondos, recorta personas y monta el diseño entero con IA. Sin Photoshop, sin curva de aprendizaje. En español.",
  "home.hero.cta": "Empezar gratis",
  "home.hero.cta2": "Ver plantillas",
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
  "nav.projects": "Mis recursos",
  "nav.collaborators": "Colaboradores",
  "nav.history": "Historial",
  "nav.pricing": "Precios",
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
  "auth.error.confirmationTimeout": "Tardamos en detectar tu confirmación. Inicia sesión manualmente con tu email y password.",
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
  // SHEETS titles
  "mobileEditor.sheet.photo": "Foto",
  "mobileEditor.sheet.style": "Estilo",
  "mobileEditor.sheet.remix": "Remix · 4 estilos",
  "mobileEditor.sheet.more": "Más opciones",
  "mobileEditor.sheet.export": "Exportar",
  "mobileEditor.sheet.add": "Añadir elemento",
  "mobileEditor.sheet.layers": "Capas",
  "mobileEditor.sheet.format": "Formatos",
  "mobileEditor.sheet.assistant": "Asistente IA",
  // PHOTO
  "mobileEditor.photo.flyerPhotos": "Fotos del flyer",
  "mobileEditor.photo.noPhotos": "Esta plantilla no tiene fotos.",
  "mobileEditor.photo.tapToEdit": "Tap en una foto para editarla (reemplazar, recortar, filtros, opacidad).",
  "mobileEditor.photo.uploadNew": "Subir foto nueva",
  "mobileEditor.photo.uploadHint": "Se añade al centro del flyer y queda seleccionada para moverla.",
  "mobileEditor.toast.photoAddedFailed": "No se pudo añadir la foto",
  // STYLE
  "mobileEditor.style.palettesFor": "Paletas para",
  "mobileEditor.toast.paletteApplied": "Paleta aplicada",
  // REMIX
  "mobileEditor.remix.intro": "Aplica un estilo completo (paleta + fuente + efectos) al instante. Tu contenido se mantiene.",
  "mobileEditor.remix.generateAI": "Generar con IA",
  "mobileEditor.remix.beta": "Beta",
  "mobileEditor.remix.surprise": "Sorpréndeme",
  "mobileEditor.remix.neon": "Neón",
  "mobileEditor.remix.elegant": "Elegante",
  "mobileEditor.remix.vintage": "Vintage",
  "mobileEditor.remix.curatedStyles": "Estilos curados",
  "mobileEditor.remix.applied": "Aplicado",
  "mobileEditor.toast.styleApplied": "Estilo aplicado",
  "mobileEditor.toast.remixError": "Error al generar remix",
  "mobileEditor.toast.rateLimitWait": "Demasiadas peticiones, espera 1 min",
  // MORE
  "mobileEditor.more.myFlyers": "Mis flyers",
  "mobileEditor.more.myFlyersSub": "Volver a tus diseños guardados",
  "mobileEditor.more.viewTutorial": "Ver tutorial",
  "mobileEditor.more.viewTutorialSub": "Repetir la guía rápida del editor",
  "mobileEditor.more.layers": "Capas",
  "mobileEditor.more.layersSub": "Ver y organizar elementos del flyer",
  "mobileEditor.more.aiAssistant": "Asistente IA",
  "mobileEditor.more.aiAssistantSub": "Describe tu evento y rellena el flyer",
  "mobileEditor.more.changeFormat": "Formatos",
  "mobileEditor.more.changeFormatSub": "Cuadrado, Story, Vertical, Imprimir…",
  "mobileEditor.more.resetTemplate": "Reiniciar plantilla",
  "mobileEditor.more.resetTemplateSub": "Volver al diseño original",
  "mobileEditor.more.comingSoon": "Próximo",
  // EXPORT
  "mobileEditor.export.fileType": "Tipo de archivo",
  "mobileEditor.export.png": "PNG",
  "mobileEditor.export.jpg": "JPG",
  "mobileEditor.export.pdf": "PDF",
  "mobileEditor.export.svg": "SVG",
  "mobileEditor.export.pngSubtitle": "Calidad máxima",
  "mobileEditor.export.jpgSubtitle": "Archivo ligero",
  "mobileEditor.export.pdfSubtitle": "Imprenta",
  "mobileEditor.export.svgSubtitle": "Vector",
  "mobileEditor.export.pngHelp": "PNG sin pérdida. Texto nítido y bordes perfectos. Ideal imprimir o subir a Instagram en alta.",
  "mobileEditor.export.jpgHelp": "JPG comprimido (~5× más liviano). Ideal WhatsApp y rapidez. Puede mostrar artefactos en texto fino.",
  "mobileEditor.export.pdfHelp": "PDF para imprenta profesional. Tamaño real en mm, calidad de impresión.",
  "mobileEditor.export.svgHelp": "SVG vectorial. Editable en Illustrator/Figma/Inkscape sin perder calidad. Las redes sociales pueden no aceptarlo.",
  "mobileEditor.export.templateHas": "Esta plantilla tiene",
  "mobileEditor.export.textsMaintained": "Los textos editados se mantienen al cambiar de formato.",
  "mobileEditor.export.edited": "Editado",
  "mobileEditor.export.download": "Descargar",
  "mobileEditor.export.downloadAll": "Descargar todos",
  "mobileEditor.export.exporting": "Exportando…",
  "mobileEditor.export.notice": "Los formatos distintos al actual se renderizan con la maquetación original — paleta, remix e imágenes subidas solo se preservan en el formato actual.",
  "mobileEditor.toast.downloaded": "Descargado",
  "mobileEditor.toast.downloadedSvg": "Descargado SVG vectorial",
  "mobileEditor.toast.downloadedPdf": "Descargado PDF para imprenta",
  "mobileEditor.toast.exportError": "Error al renderizar",
  "mobileEditor.toast.allDownloaded": "Descargados todos los formatos",
  // SHARE
  "mobileEditor.share.title": "Compartir flyer",
  "mobileEditor.share.downloadedOk": "Descargado correctamente",
  "mobileEditor.share.systemShare": "Compartir con la app del sistema",
  "mobileEditor.share.orChoose": "O elige una red",
  "mobileEditor.share.whatsapp": "WhatsApp",
  "mobileEditor.share.instagram": "Instagram",
  "mobileEditor.share.facebook": "Facebook",
  "mobileEditor.share.twitter": "Twitter",
  "mobileEditor.share.telegram": "Telegram",
  "mobileEditor.share.email": "Email",
  "mobileEditor.share.copyLink": "Copiar link",
  "mobileEditor.share.copied": "Copiado ✓",
  "mobileEditor.share.redownload": "Re-descargar",
  "mobileEditor.share.privateUrl": "Tu flyer se publica en una URL privada. Solo quien recibe el link puede verlo.",
  "mobileEditor.share.message": "Mira el flyer que hice con ArteGenIA 🎨",
  "mobileEditor.share.credit": "Creado con ArteGenIA — artegenia.vercel.app",
  "mobileEditor.share.igTitle": "Compartir en Instagram",
  "mobileEditor.share.igIntro": "Instagram no permite compartir desde la web automáticamente. Sigue estos 3 pasos:",
  "mobileEditor.share.igStep1": "Ya tienes el flyer descargado en tu galería.",
  "mobileEditor.share.igStep2": "Abre Instagram → toca el + arriba.",
  "mobileEditor.share.igStep3": "Elige Historia o Publicación y selecciona el flyer.",
  "mobileEditor.share.igOpen": "Abrir Instagram",
  "mobileEditor.share.close": "Cerrar",
  "mobileEditor.toast.shareUploadFailed": "No se pudo preparar el enlace",
  "mobileEditor.toast.loginToShare": "Inicia sesión para compartir",
  // LAYERS
  "mobileEditor.layers.intro": "Las capas se muestran en orden — la superior se ve encima del resto.",
  "mobileEditor.layers.empty": "Este flyer no tiene capas editables aún.",
  "mobileEditor.layers.emptyHint": "Usa el botón \"Añadir\" abajo para crear elementos.",
  "mobileEditor.layers.aria.up": "Subir capa",
  "mobileEditor.layers.aria.down": "Bajar capa",
  "mobileEditor.layers.aria.show": "Mostrar",
  "mobileEditor.layers.aria.hide": "Ocultar",
  "mobileEditor.layers.fallback.text": "Texto",
  "mobileEditor.layers.fallback.image": "Imagen",
  "mobileEditor.layers.fallback.rect": "Rectángulo",
  "mobileEditor.layers.fallback.circle": "Círculo",
  "mobileEditor.layers.fallback.triangle": "Triángulo",
  "mobileEditor.layers.fallback.shape": "Forma",
  // CHANGE FORMAT
  "mobileEditor.changeFormat.intro": "Cambia el tamaño y proporción del flyer manteniendo el contenido. Si tienes cambios sin guardar se guardan antes de cambiar.",
  "mobileEditor.changeFormat.current": "Actual",
  "mobileEditor.changeFormat.noVariant": "Esta plantilla no tiene formato",
  // ADD ELEMENT
  "mobileEditor.add.textSection": "Texto",
  "mobileEditor.add.shapesSection": "Formas",
  "mobileEditor.add.imageSection": "Imagen",
  "mobileEditor.add.title": "Título",
  "mobileEditor.add.subtitle": "Subtítulo",
  "mobileEditor.add.body": "Cuerpo",
  "mobileEditor.add.rect": "Rect",
  "mobileEditor.add.circle": "Círculo",
  "mobileEditor.add.triangle": "Triáng.",
  "mobileEditor.add.heart": "Corazón",
  "mobileEditor.add.star": "Estrella",
  "mobileEditor.add.line": "Línea",
  "mobileEditor.add.uploadPhoto": "Subir foto de tu galería",
  "mobileEditor.add.hint": "El elemento se añade centrado y queda seleccionado para editarlo.",
  // ASSISTANT
  "mobileEditor.assistant.loginTitle": "Inicia sesión para usar la IA",
  "mobileEditor.assistant.loginDesc": "El Asistente IA rellena tu flyer automáticamente a partir de una descripción. Necesitamos identificarte para protegerlo del abuso. Es gratis.",
  "mobileEditor.assistant.loginBtn": "Iniciar sesión",
  "mobileEditor.assistant.loginFooter": "Tus diseños no se pierden — esperan en este editor mientras te logueas.",
  "mobileEditor.assistant.headerTitle": "Describe tu evento en 1 frase",
  "mobileEditor.assistant.headerDesc": "La IA rellena automáticamente todos los campos del flyer.",
  "mobileEditor.assistant.placeholder": "Ej: Clase de bachata sábado 22 noviembre 16-20h en Studio Kiz Madrid, 70€ early bird 60€",
  "mobileEditor.assistant.examples": "Ejemplos rápidos",
  "mobileEditor.assistant.generating": "Generando…",
  "mobileEditor.assistant.generate": "Generar con IA",
  "mobileEditor.assistant.poweredBy": "Powered by Claude Haiku · 10 generaciones por minuto",
  "mobileEditor.assistant.previewTitle": "Vista previa generada por IA",
  "mobileEditor.assistant.previewDesc": "Revisa que los datos sean correctos. Cuando estés conforme, pulsa \"Aplicar al flyer\".",
  "mobileEditor.assistant.retry": "Reintentar",
  "mobileEditor.assistant.apply": "Aplicar al flyer",
  "mobileEditor.assistant.emptyValue": "(vacío)",
  "mobileEditor.toast.assistantApplied": "Campos rellenados con IA",
  "mobileEditor.toast.assistantError": "La IA no pudo generar el flyer",
  "mobileEditor.toast.assistantEmpty": "La IA no devolvió valores — intenta con otra descripción",
  "mobileEditor.toast.assistantNeedPrompt": "Escribe primero qué evento es",
  // ONBOARDING
  "mobileEditor.onb.step1Title": "Toca el texto para editarlo",
  "mobileEditor.onb.step1Body": "Cualquier texto del flyer es editable. Cambia el nombre del evento, fecha, precio... Solo toca y escribe.",
  "mobileEditor.onb.step2Title": "Añade elementos con el +",
  "mobileEditor.onb.step2Body": "Pulsa el botón Añadir abajo para insertar texto nuevo, formas, estrellas, corazones o tus propias fotos.",
  "mobileEditor.onb.step3Title": "Cambia el estilo con 1 tap",
  "mobileEditor.onb.step3Body": "Estilo aplica paletas curadas. Remix genera variantes con IA. Comparte tu flyer en WhatsApp, Instagram y más.",
  "mobileEditor.onb.step4Title": "Exporta y comparte",
  "mobileEditor.onb.step4Body": "Cuando esté listo, pulsa Exportar arriba. Elige PNG, JPG, PDF imprenta o SVG vectorial. Luego compártelo en redes sociales con 1 tap.",
  "mobileEditor.onb.skip": "Saltar",
  "mobileEditor.onb.next": "Siguiente",
  "mobileEditor.onb.start": "Empezar",
  // ── AGENDA EVENTOS ──
  "eventos.cat.fiesta": "Fiesta",
  "eventos.cat.conciertos": "Conciertos",
  "eventos.cat.festival": "Festival",
  "eventos.cat.clases": "Clases de baile",
  "eventos.cat.club": "Club / Discoteca",
  "eventos.cat.corporativo": "Corporativo",
  "eventos.cat.social": "Bailes sociales",
  "eventos.cat.teatro": "Teatro",
  "eventos.aud.academias": "Academias",
  "eventos.aud.productoras": "Productoras",
  "eventos.aud.freelance": "Freelance",
  "eventos.aud.instituciones": "Instituciones",
  "eventos.aud.agencias": "Agencias",
  "eventos.aud.colegios": "Colegios",
  "eventos.city.todas": "Todas las ciudades",
  "eventos.date.todos": "Todos",
  "eventos.date.hoy": "Hoy",
  "eventos.date.manana": "Mañana",
  "eventos.date.finde": "Este finde",
  "eventos.date.semana": "Esta semana",
  "eventos.date.mes": "Este mes",
  "eventos.date.rango": "Rango",
  "eventos.topbar.brand": "Agenda",
  "eventos.topbar.shareAria": "Compartir la agenda",
  "eventos.topbar.shareCopied": "¡Enlace copiado!",
  "eventos.topbar.share": "Compartir",
  "eventos.topbar.publishShort": "Publicar",
  "eventos.topbar.uploadShort": "Sube tu evento",
  "eventos.organizer.publish": "Publicar evento",
  "eventos.organizer.uploadFree": "Sube tu evento gratis",
  "eventos.hero.badge": "Agenda cultural pública",
  "eventos.hero.titleMobile": "Planes culturales en ",
  "eventos.hero.titleDesktop": "¿Qué planes hay en ",
  "eventos.hero.subtitle": "Conciertos, exposiciones, teatro y más cerca de ti.",
  "eventos.country.soon": "pronto",
  "eventos.search.placeholder": "Busca eventos, salas o barrios",
  "eventos.search.nearMe": "Cerca de mí",
  "eventos.geo.unsupported": "Tu navegador no permite ubicación",
  "eventos.geo.showing": "Mostrando {place}",
  "eventos.geo.noneNearby": "Aún no hay eventos cerca de ti",
  "eventos.geo.failed": "No pudimos obtener tu ubicación",
  "eventos.geo.errorPrompt": "{msg} · escribe tu ciudad:",
  "eventos.filters.free": "Gratis",
  "eventos.filters.nearMe": "Cerca de mí",
  "eventos.filters.more": "Más filtros",
  "eventos.view.lista": "Lista",
  "eventos.view.calendario": "Calendario",
  "eventos.filters.whenLabel": "Cuándo",
  "eventos.filters.categoryLabel": "Categoría",
  "eventos.filters.audienceLabel": "Para quién es",
  "eventos.filters.saved": "Guardados",
  "eventos.range.from": "Desde",
  "eventos.range.to": "hasta",
  "eventos.count.one": "evento",
  "eventos.count.many": "eventos",
  "eventos.count.in": "en",
  "eventos.count.mockBadge": "ejemplos de muestra",
  "eventos.cityauto.placeholder": "Escribe tu ciudad…",
  "eventos.cityauto.empty": "Aún no tenemos eventos ahí. Prueba Madrid, Barcelona, Valencia…",
  "eventos.band.titleHas": "¿Tienes un nuevo evento?",
  "eventos.band.titleOrg": "¿Organizas eventos?",
  "eventos.band.descHas": "Publícalo en la agenda y crea su flyer en minutos con tu cuenta.",
  "eventos.band.descOrg": "Publica tu evento en la agenda y crea su flyer en minutos. Gratis para empezar.",
  "eventos.band.ctaHas": "Publicar evento",
  "eventos.band.ctaOrg": "Sube tu evento gratis",
  "eventos.auth.title": "Publica tu evento",
  "eventos.auth.subtitle": "Crea tu cuenta de organizador. Es gratis para empezar.",
  "eventos.publish.titleHas": "Publica tu evento",
  "eventos.publish.titleOrg": "Sube tu evento gratis",
  "eventos.publish.subtitle": "Elige la vía más rápida para ti. Mandas el flyer y nosotros leemos fecha, lugar y precio.",
  "eventos.publish.close": "Cerrar",
  "eventos.publish.web.title": "Aquí mismo (asistente)",
  "eventos.publish.web.fast": "RÁPIDO",
  "eventos.publish.web.descHas": "Sube el flyer y se rellena solo. Vas directo a tu panel.",
  "eventos.publish.web.descOrg": "Sube el flyer y se rellena solo. Creas tu cuenta gratis en segundos.",
  "eventos.publish.telegram.title": "Por Telegram",
  "eventos.publish.telegram.noAccount": "SIN CUENTA",
  "eventos.publish.telegram.desc": "Mándale el flyer al bot y se publica solo. Tus eventos te esperan si luego abres cuenta.",
  "eventos.publish.telegram.soonDesc": "Activando el bot — disponible muy pronto.",
  "eventos.publish.whatsapp.title": "Por WhatsApp",
  "eventos.publish.whatsapp.desc": "Próximamente: el mismo bot, en tu WhatsApp.",
  "eventos.publish.voice.title": "Por voz",
  "eventos.publish.voice.desc": "Próximamente: cuéntale tu evento con un audio.",
  "eventos.publish.soonBadge": "PRONTO",
  "eventos.list.today": "Hoy · ",
  "eventos.list.seeAll": "Ver todos",
  "eventos.card.consult": "Consultar",
  "eventos.card.free": "Gratis",
  "eventos.card.priceFrom": "desde ",
  "eventos.card.removeFav": "Quitar de guardados",
  "eventos.card.addFav": "Guardar evento",
  "eventos.card.cancelled": "Cancelado",
  "eventos.card.tickets": "Entradas",
  "eventos.card.seeEvent": "Ver evento",
  "eventos.cal.more": "+{n} más",
  "eventos.cal.legend": "Leyenda",
  "eventos.rsvp.join": "Voy",
  "eventos.rsvp.joined": "¡Vas!",
  "eventos.rsvp.count": "{n} asistirán",
  "eventos.stats.week": "esta semana",
  "eventos.stats.free": "gratis",
  "eventos.stats.attending": "asistirán",
  "eventos.stats.summary": "Resumen",
  "eventos.featured.title": "Próximos destacados",
  "eventos.featured.popular": "Popular hoy",
  "eventos.featured.see": "Ver evento",
  "eventos.modal.seeFlyer": "Ver flyer",
  "eventos.modal.priceTbc": "Precio por confirmar",
  "eventos.modal.priceFree": "Entrada gratuita",
  "eventos.modal.timeSuffix": "h",
  "eventos.modal.saved": "Guardado",
  "eventos.modal.save": "Guardar",
  "eventos.modal.copied": "¡Copiado!",
  "eventos.modal.share": "Compartir",
  "eventos.modal.buyOnline": "Comprar entradas online",
  "eventos.modal.freeEntry": "Entrada libre — no necesitas reservar",
  "eventos.modal.consultOrganizer": "Consulta el precio con el organizador",
  "eventos.modal.boxOffice": "Entradas en taquilla",
  "eventos.lightbox.close": "Cerrar",
  "eventos.seal.cancelled": "Cancelado",
  "eventos.empty.title": "No hay eventos con esos filtros",
  "eventos.empty.body": "Prueba a cambiar la ciudad, las fechas o quita algún filtro.",
  "eventos.empty.reset": "Limpiar filtros",
  // ── PANEL ORGANIZADOR ──
  "org.cat.fiesta": "Fiesta",
  "org.cat.conciertos": "Conciertos",
  "org.cat.festival": "Festival",
  "org.cat.clases": "Clases de baile",
  "org.cat.club": "Club / Discoteca",
  "org.cat.corporativo": "Corporativo",
  "org.cat.social": "Bailes sociales",
  "org.cat.teatro": "Teatro",
  "org.aud.academias": "Academias",
  "org.aud.productoras": "Productoras",
  "org.aud.freelance": "Freelance",
  "org.aud.instituciones": "Instituciones",
  "org.aud.agencias": "Agencias",
  "org.aud.colegios": "Colegios",
  "org.claim.success": "✅ Has reclamado {n} {events} enviados por el bot.",
  "org.gate.titleClaim": "Inicia sesión para reclamar tus eventos",
  "org.gate.titlePublish": "Inicia sesión para publicar eventos",
  "org.gate.bodyClaim": "Los flyers que enviaste por el bot ya están publicados. Abre tu cuenta para gestionarlos.",
  "org.gate.bodyPublish": "Crea tu cuenta de organizador para añadir eventos a la agenda y diseñar sus flyers.",
  "org.gate.signIn": "Iniciar sesión",
  "org.gate.back": "← Volver a la agenda",
  "org.gate.authClaim": "Reclama tus eventos",
  "org.gate.authPublish": "Publica tu evento",
  "org.auth.subtitle": "Crea tu cuenta de organizador. Es gratis para empezar.",
  "org.header.backLink": "← Agenda pública",
  "org.header.titleAdmin": "Todos los eventos",
  "org.header.titleMine": "Mis eventos",
  "org.header.adminBadge": "Admin",
  "org.header.descAdmin": "Gestiona cualquier evento (incluidos los del bot sin dueño).",
  "org.header.descMine": "Publica eventos en la agenda y diseña sus flyers.",
  "org.header.newEvent": "Nuevo evento",
  "org.loading": "Cargando tus eventos…",
  "org.section.drafts": "Borradores",
  "org.section.draftsHint": "Solo tú los ves. Publícalos para que aparezcan en la agenda.",
  "org.section.upcoming": "Próximos ({n})",
  "org.section.upcomingHint": "Publicados y aún por celebrarse — visibles en la agenda.",
  "org.section.upcomingEmpty": "No tienes eventos próximos. Pulsa “Nuevo evento” o envía un flyer al bot.",
  "org.section.past": "Vencidos ({n})",
  "org.section.pastHint": "Ya pasaron. No aparecen en la agenda pública.",
  "org.section.cancelled": "Cancelados ({n})",
  "org.section.cancelledHint": "Siguen visibles en la agenda con el sello CANCELADO. Puedes reactivarlos.",
  "org.row.cancelShort": "Cancel.",
  "org.row.consult": "Consultar",
  "org.row.free": "Gratis",
  "org.row.series": "🔁 serie · {n} fechas",
  "org.row.anon": "anónimo",
  "org.row.unpublish": "Despublicar",
  "org.row.publish": "Publicar",
  "org.row.reactivate": "Reactivar evento",
  "org.row.markCancelled": "Marcar cancelado",
  "org.row.edit": "Editar",
  "org.row.delete": "Borrar",
  "org.delete.confirm": "¿Borrar \"{title}\"? Esta acción no se puede deshacer.",
  "org.form.titleEdit": "Editar evento",
  "org.form.titleNew": "Nuevo evento",
  "org.form.errRequired": "Rellena al menos título, fecha y lugar.",
  "org.form.errUpload": "No se pudo subir el flyer",
  "org.form.errUploadGeneric": "Error al subir el flyer",
  "org.form.labelTitle": "Título *",
  "org.form.phTitle": "Ej. Concierto de verano",
  "org.form.labelDate": "Fecha *",
  "org.form.labelTime": "Hora",
  "org.form.labelCity": "Ciudad",
  "org.form.labelCategory": "Categoría",
  "org.form.labelAudience": "Para quién es (opcional)",
  "org.form.labelVenue": "Lugar / sala *",
  "org.form.phVenue": "Ej. Sala La Riviera",
  "org.form.labelNeighborhood": "Barrio / zona",
  "org.form.phNeighborhood": "Ej. Centro",
  "org.form.labelFlyer": "Flyer del evento",
  "org.form.uploading": "Subiendo…",
  "org.form.changeFlyer": "Cambiar flyer",
  "org.form.uploadFlyer": "Subir flyer",
  "org.form.noFlyer": "¿No tienes flyer? Créalo aquí",
  "org.form.labelPrice": "Precio (€) — vacío = consultar · 0 = gratis",
  "org.form.phPrice": "desde…",
  "org.form.labelPriceInfo": "Tarifas (si hay varias)",
  "org.form.phPriceInfo": "Anticipada 12€ · Taquilla 15€",
  "org.form.onlineSale": "¿Venta de entradas online?",
  "org.form.phTicketUrl": "https://… página del evento o pago",
  "org.form.labelDescription": "Descripción",
  "org.form.phDescription": "Detalles del evento…",
  "org.form.saveDraft": "Guardar borrador",
  "org.form.publish": "Publicar",
  "org.empty.title": "Aún no tienes eventos",
  "org.empty.body": "Crea tu primer evento y publícalo en la agenda pública en menos de un minuto.",
  "org.empty.create": "Crear evento",
};

const en: Dict = {
  "home.hero.title.line1": "Your pro flyer",
  "home.hero.title.line2": "with AI in 2 min for",
  "home.hero.title.highlight": "your event",
  "home.hero.title.rotating": "your party, your concerts, your festival, your dance classes, your club, your corporate event, your academy, your institution, your school, your production company, private tutors",
  "home.hero.subtitle": "Remove backgrounds, cut out people and design the whole flyer with AI. No Photoshop, no learning curve.",
  "home.hero.cta": "Start free",
  "home.hero.cta2": "Browse templates",
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
  "nav.projects": "My resources",
  "nav.collaborators": "Collaborators",
  "nav.history": "History",
  "nav.pricing": "Pricing",
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
  "auth.error.confirmationTimeout": "We couldn't detect your confirmation in time. Please sign in manually with your email and password.",
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
  "mobileEditor.sheet.photo": "Photo",
  "mobileEditor.sheet.style": "Style",
  "mobileEditor.sheet.remix": "Remix · 4 styles",
  "mobileEditor.sheet.more": "More options",
  "mobileEditor.sheet.export": "Export",
  "mobileEditor.sheet.add": "Add element",
  "mobileEditor.sheet.layers": "Layers",
  "mobileEditor.sheet.format": "Change format",
  "mobileEditor.sheet.assistant": "AI Assistant",
  "mobileEditor.photo.flyerPhotos": "Flyer photos",
  "mobileEditor.photo.noPhotos": "This template has no photos.",
  "mobileEditor.photo.tapToEdit": "Tap a photo to edit it (replace, crop, filters, opacity).",
  "mobileEditor.photo.uploadNew": "Upload new photo",
  "mobileEditor.photo.uploadHint": "Added centered on the flyer and selected for you to move.",
  "mobileEditor.toast.photoAddedFailed": "Could not add photo",
  "mobileEditor.style.palettesFor": "Palettes for",
  "mobileEditor.toast.paletteApplied": "Palette applied",
  "mobileEditor.remix.intro": "Apply a complete style (palette + font + effects) instantly. Your content stays.",
  "mobileEditor.remix.generateAI": "Generate with AI",
  "mobileEditor.remix.beta": "Beta",
  "mobileEditor.remix.surprise": "Surprise me",
  "mobileEditor.remix.neon": "Neon",
  "mobileEditor.remix.elegant": "Elegant",
  "mobileEditor.remix.vintage": "Vintage",
  "mobileEditor.remix.curatedStyles": "Curated styles",
  "mobileEditor.remix.applied": "Applied",
  "mobileEditor.toast.styleApplied": "Style applied",
  "mobileEditor.toast.remixError": "Error generating remix",
  "mobileEditor.toast.rateLimitWait": "Too many requests, wait 1 min",
  "mobileEditor.more.myFlyers": "My flyers",
  "mobileEditor.more.myFlyersSub": "Go back to your saved designs",
  "mobileEditor.more.viewTutorial": "View tutorial",
  "mobileEditor.more.viewTutorialSub": "Replay the editor quick guide",
  "mobileEditor.more.layers": "Layers",
  "mobileEditor.more.layersSub": "View and organize flyer elements",
  "mobileEditor.more.aiAssistant": "AI Assistant",
  "mobileEditor.more.aiAssistantSub": "Describe your event and fill the flyer",
  "mobileEditor.more.changeFormat": "Change format",
  "mobileEditor.more.changeFormatSub": "Story 9:16, Post 4:5, etc.",
  "mobileEditor.more.resetTemplate": "Reset template",
  "mobileEditor.more.resetTemplateSub": "Restore the original design",
  "mobileEditor.more.comingSoon": "Soon",
  "mobileEditor.export.fileType": "File type",
  "mobileEditor.export.png": "PNG",
  "mobileEditor.export.jpg": "JPG",
  "mobileEditor.export.pdf": "PDF",
  "mobileEditor.export.svg": "SVG",
  "mobileEditor.export.pngSubtitle": "Best quality",
  "mobileEditor.export.jpgSubtitle": "Lightweight",
  "mobileEditor.export.pdfSubtitle": "Print",
  "mobileEditor.export.svgSubtitle": "Vector",
  "mobileEditor.export.pngHelp": "Lossless PNG. Crisp text and perfect edges. Ideal for printing or Instagram in high quality.",
  "mobileEditor.export.jpgHelp": "Compressed JPG (~5× lighter). Ideal for WhatsApp and speed. May show artifacts in thin text.",
  "mobileEditor.export.pdfHelp": "PDF for professional printing. Real size in mm, print quality.",
  "mobileEditor.export.svgHelp": "Vector SVG. Editable in Illustrator/Figma/Inkscape without quality loss. Social networks may not accept it.",
  "mobileEditor.export.templateHas": "This template has",
  "mobileEditor.export.textsMaintained": "Edited texts are kept when changing format.",
  "mobileEditor.export.edited": "Edited",
  "mobileEditor.export.download": "Download",
  "mobileEditor.export.downloadAll": "Download all",
  "mobileEditor.export.exporting": "Exporting…",
  "mobileEditor.export.notice": "Formats other than the current one are rendered with the original layout — palette, remix and uploaded images are only preserved in the current format.",
  "mobileEditor.toast.downloaded": "Downloaded",
  "mobileEditor.toast.downloadedSvg": "Vector SVG downloaded",
  "mobileEditor.toast.downloadedPdf": "PDF for print downloaded",
  "mobileEditor.toast.exportError": "Render error",
  "mobileEditor.toast.allDownloaded": "All formats downloaded",
  "mobileEditor.share.title": "Share flyer",
  "mobileEditor.share.downloadedOk": "Downloaded successfully",
  "mobileEditor.share.systemShare": "Share with system app",
  "mobileEditor.share.orChoose": "Or choose a network",
  "mobileEditor.share.whatsapp": "WhatsApp",
  "mobileEditor.share.instagram": "Instagram",
  "mobileEditor.share.facebook": "Facebook",
  "mobileEditor.share.twitter": "Twitter",
  "mobileEditor.share.telegram": "Telegram",
  "mobileEditor.share.email": "Email",
  "mobileEditor.share.copyLink": "Copy link",
  "mobileEditor.share.copied": "Copied ✓",
  "mobileEditor.share.redownload": "Re-download",
  "mobileEditor.share.privateUrl": "Your flyer is published at a private URL. Only those who receive the link can see it.",
  "mobileEditor.share.message": "Check the flyer I made with ArteGenIA 🎨",
  "mobileEditor.share.credit": "Made with ArteGenIA — artegenia.vercel.app",
  "mobileEditor.share.igTitle": "Share on Instagram",
  "mobileEditor.share.igIntro": "Instagram doesn't allow sharing from the web automatically. Follow these 3 steps:",
  "mobileEditor.share.igStep1": "You already have the flyer downloaded to your gallery.",
  "mobileEditor.share.igStep2": "Open Instagram → tap the + at the top.",
  "mobileEditor.share.igStep3": "Choose Story or Post and select the flyer.",
  "mobileEditor.share.igOpen": "Open Instagram",
  "mobileEditor.share.close": "Close",
  "mobileEditor.toast.shareUploadFailed": "Could not prepare link",
  "mobileEditor.toast.loginToShare": "Sign in to share",
  "mobileEditor.layers.intro": "Layers are shown in order — the top one appears above the rest.",
  "mobileEditor.layers.empty": "This flyer has no editable layers yet.",
  "mobileEditor.layers.emptyHint": "Use the \"Add\" button below to create elements.",
  "mobileEditor.layers.aria.up": "Move layer up",
  "mobileEditor.layers.aria.down": "Move layer down",
  "mobileEditor.layers.aria.show": "Show",
  "mobileEditor.layers.aria.hide": "Hide",
  "mobileEditor.layers.fallback.text": "Text",
  "mobileEditor.layers.fallback.image": "Image",
  "mobileEditor.layers.fallback.rect": "Rectangle",
  "mobileEditor.layers.fallback.circle": "Circle",
  "mobileEditor.layers.fallback.triangle": "Triangle",
  "mobileEditor.layers.fallback.shape": "Shape",
  "mobileEditor.changeFormat.intro": "Change the size and proportion of the flyer keeping the content. If you have unsaved changes they are saved first.",
  "mobileEditor.changeFormat.current": "Current",
  "mobileEditor.changeFormat.noVariant": "This template doesn't have format",
  "mobileEditor.add.textSection": "Text",
  "mobileEditor.add.shapesSection": "Shapes",
  "mobileEditor.add.imageSection": "Image",
  "mobileEditor.add.title": "Title",
  "mobileEditor.add.subtitle": "Subtitle",
  "mobileEditor.add.body": "Body",
  "mobileEditor.add.rect": "Rect",
  "mobileEditor.add.circle": "Circle",
  "mobileEditor.add.triangle": "Triangle",
  "mobileEditor.add.heart": "Heart",
  "mobileEditor.add.star": "Star",
  "mobileEditor.add.line": "Line",
  "mobileEditor.add.uploadPhoto": "Upload photo from gallery",
  "mobileEditor.add.hint": "The element is added centered and selected for you to edit.",
  "mobileEditor.assistant.loginTitle": "Sign in to use AI",
  "mobileEditor.assistant.loginDesc": "The AI Assistant fills your flyer automatically from a description. We need to identify you to protect against abuse. It's free.",
  "mobileEditor.assistant.loginBtn": "Sign in",
  "mobileEditor.assistant.loginFooter": "Your designs are not lost — they wait in this editor while you sign in.",
  "mobileEditor.assistant.headerTitle": "Describe your event in 1 sentence",
  "mobileEditor.assistant.headerDesc": "The AI automatically fills all flyer fields.",
  "mobileEditor.assistant.placeholder": "Ex: Bachata class Saturday Nov 22 4-8pm at Studio Kiz Madrid, €70 early bird €60",
  "mobileEditor.assistant.examples": "Quick examples",
  "mobileEditor.assistant.generating": "Generating…",
  "mobileEditor.assistant.generate": "Generate with AI",
  "mobileEditor.assistant.poweredBy": "Powered by Claude Haiku · 10 generations per minute",
  "mobileEditor.assistant.previewTitle": "AI-generated preview",
  "mobileEditor.assistant.previewDesc": "Review the data is correct. When ready, press \"Apply to flyer\".",
  "mobileEditor.assistant.retry": "Retry",
  "mobileEditor.assistant.apply": "Apply to flyer",
  "mobileEditor.assistant.emptyValue": "(empty)",
  "mobileEditor.toast.assistantApplied": "Fields filled with AI",
  "mobileEditor.toast.assistantError": "AI could not generate the flyer",
  "mobileEditor.toast.assistantEmpty": "AI returned no values — try another description",
  "mobileEditor.toast.assistantNeedPrompt": "Write the event first",
  "mobileEditor.onb.step1Title": "Tap the text to edit it",
  "mobileEditor.onb.step1Body": "Any flyer text is editable. Change the event name, date, price... Just tap and type.",
  "mobileEditor.onb.step2Title": "Add elements with +",
  "mobileEditor.onb.step2Body": "Press the Add button below to insert new text, shapes, stars, hearts or your own photos.",
  "mobileEditor.onb.step3Title": "Change style in 1 tap",
  "mobileEditor.onb.step3Body": "Style applies curated palettes. Remix generates variants with AI. Share your flyer on WhatsApp, Instagram and more.",
  "mobileEditor.onb.step4Title": "Export and share",
  "mobileEditor.onb.step4Body": "When ready, press Export at the top. Choose PNG, JPG, print PDF or vector SVG. Then share it on social media in 1 tap.",
  "mobileEditor.onb.skip": "Skip",
  "mobileEditor.onb.next": "Next",
  "mobileEditor.onb.start": "Start",
  // ── AGENDA EVENTOS ──
  "eventos.cat.fiesta": "Party",
  "eventos.cat.conciertos": "Concerts",
  "eventos.cat.festival": "Festival",
  "eventos.cat.clases": "Dance classes",
  "eventos.cat.club": "Club",
  "eventos.cat.corporativo": "Corporate",
  "eventos.cat.social": "Social dancing",
  "eventos.cat.teatro": "Theatre",
  "eventos.aud.academias": "Academies",
  "eventos.aud.productoras": "Production companies",
  "eventos.aud.freelance": "Freelance",
  "eventos.aud.instituciones": "Institutions",
  "eventos.aud.agencias": "Agencies",
  "eventos.aud.colegios": "Schools",
  "eventos.city.todas": "All cities",
  "eventos.date.todos": "All",
  "eventos.date.hoy": "Today",
  "eventos.date.manana": "Tomorrow",
  "eventos.date.finde": "This weekend",
  "eventos.date.semana": "This week",
  "eventos.date.mes": "This month",
  "eventos.date.rango": "Range",
  "eventos.topbar.brand": "Agenda",
  "eventos.topbar.shareAria": "Share the agenda",
  "eventos.topbar.shareCopied": "Link copied!",
  "eventos.topbar.share": "Share",
  "eventos.topbar.publishShort": "Publish",
  "eventos.topbar.uploadShort": "Add your event",
  "eventos.organizer.publish": "Publish event",
  "eventos.organizer.uploadFree": "Add your event for free",
  "eventos.hero.badge": "Public cultural agenda",
  "eventos.hero.titleMobile": "Cultural plans in ",
  "eventos.hero.titleDesktop": "What's happening in ",
  "eventos.hero.subtitle": "Concerts, exhibitions, theatre and more near you.",
  "eventos.country.soon": "soon",
  "eventos.search.placeholder": "Search events, venues or neighbourhoods",
  "eventos.search.nearMe": "Near me",
  "eventos.geo.unsupported": "Your browser doesn't allow location",
  "eventos.geo.showing": "Showing {place}",
  "eventos.geo.noneNearby": "No events near you yet",
  "eventos.geo.failed": "We couldn't get your location",
  "eventos.geo.errorPrompt": "{msg} · type your city:",
  "eventos.filters.free": "Free",
  "eventos.filters.nearMe": "Near me",
  "eventos.filters.more": "More filters",
  "eventos.view.lista": "List",
  "eventos.view.calendario": "Calendar",
  "eventos.filters.whenLabel": "When",
  "eventos.filters.categoryLabel": "Category",
  "eventos.filters.audienceLabel": "Who it's for",
  "eventos.filters.saved": "Saved",
  "eventos.range.from": "From",
  "eventos.range.to": "to",
  "eventos.count.one": "event",
  "eventos.count.many": "events",
  "eventos.count.in": "in",
  "eventos.count.mockBadge": "sample examples",
  "eventos.cityauto.placeholder": "Type your city…",
  "eventos.cityauto.empty": "We don't have events there yet. Try Madrid, Barcelona, Valencia…",
  "eventos.band.titleHas": "Got a new event?",
  "eventos.band.titleOrg": "Do you organise events?",
  "eventos.band.descHas": "Publish it on the agenda and create its flyer in minutes with your account.",
  "eventos.band.descOrg": "Publish your event on the agenda and create its flyer in minutes. Free to start.",
  "eventos.band.ctaHas": "Publish event",
  "eventos.band.ctaOrg": "Add your event for free",
  "eventos.auth.title": "Publish your event",
  "eventos.auth.subtitle": "Create your organiser account. It's free to start.",
  "eventos.publish.titleHas": "Publish your event",
  "eventos.publish.titleOrg": "Add your event for free",
  "eventos.publish.subtitle": "Choose the fastest way for you. Send the flyer and we'll read the date, place and price.",
  "eventos.publish.close": "Close",
  "eventos.publish.web.title": "Right here (assistant)",
  "eventos.publish.web.fast": "FAST",
  "eventos.publish.web.descHas": "Upload the flyer and it fills itself in. You go straight to your dashboard.",
  "eventos.publish.web.descOrg": "Upload the flyer and it fills itself in. Create your free account in seconds.",
  "eventos.publish.telegram.title": "Via Telegram",
  "eventos.publish.telegram.noAccount": "NO ACCOUNT",
  "eventos.publish.telegram.desc": "Send the flyer to the bot and it publishes itself. Your events wait for you if you open an account later.",
  "eventos.publish.telegram.soonDesc": "Activating the bot — available very soon.",
  "eventos.publish.whatsapp.title": "Via WhatsApp",
  "eventos.publish.whatsapp.desc": "Coming soon: the same bot, on your WhatsApp.",
  "eventos.publish.voice.title": "By voice",
  "eventos.publish.voice.desc": "Coming soon: tell us about your event with an audio.",
  "eventos.publish.soonBadge": "SOON",
  "eventos.list.today": "Today · ",
  "eventos.list.seeAll": "See all",
  "eventos.card.consult": "Ask",
  "eventos.card.free": "Free",
  "eventos.card.priceFrom": "from ",
  "eventos.card.removeFav": "Remove from saved",
  "eventos.card.addFav": "Save event",
  "eventos.card.cancelled": "Cancelled",
  "eventos.card.tickets": "Tickets",
  "eventos.card.seeEvent": "See event",
  "eventos.cal.more": "+{n} more",
  "eventos.cal.legend": "Legend",
  "eventos.rsvp.join": "I'm going",
  "eventos.rsvp.joined": "You're in!",
  "eventos.rsvp.count": "{n} attending",
  "eventos.stats.week": "this week",
  "eventos.stats.free": "free",
  "eventos.stats.attending": "attending",
  "eventos.stats.summary": "Summary",
  "eventos.featured.title": "Featured soon",
  "eventos.featured.popular": "Popular today",
  "eventos.featured.see": "View event",
  "eventos.modal.seeFlyer": "View flyer",
  "eventos.modal.priceTbc": "Price to be confirmed",
  "eventos.modal.priceFree": "Free entry",
  "eventos.modal.timeSuffix": "h",
  "eventos.modal.saved": "Saved",
  "eventos.modal.save": "Save",
  "eventos.modal.copied": "Copied!",
  "eventos.modal.share": "Share",
  "eventos.modal.buyOnline": "Buy tickets online",
  "eventos.modal.freeEntry": "Free admission — no booking needed",
  "eventos.modal.consultOrganizer": "Ask the organiser about the price",
  "eventos.modal.boxOffice": "Tickets at the box office",
  "eventos.lightbox.close": "Close",
  "eventos.seal.cancelled": "Cancelled",
  "eventos.empty.title": "No events with those filters",
  "eventos.empty.body": "Try changing the city, the dates or removing a filter.",
  "eventos.empty.reset": "Clear filters",
  // ── PANEL ORGANIZADOR ──
  "org.cat.fiesta": "Party",
  "org.cat.conciertos": "Concerts",
  "org.cat.festival": "Festival",
  "org.cat.clases": "Dance classes",
  "org.cat.club": "Club",
  "org.cat.corporativo": "Corporate",
  "org.cat.social": "Social dancing",
  "org.cat.teatro": "Theatre",
  "org.aud.academias": "Academies",
  "org.aud.productoras": "Production companies",
  "org.aud.freelance": "Freelance",
  "org.aud.instituciones": "Institutions",
  "org.aud.agencias": "Agencies",
  "org.aud.colegios": "Schools",
  "org.claim.success": "✅ You've claimed {n} {events} sent by the bot.",
  "org.gate.titleClaim": "Sign in to claim your events",
  "org.gate.titlePublish": "Sign in to publish events",
  "org.gate.bodyClaim": "The flyers you sent through the bot are already published. Open your account to manage them.",
  "org.gate.bodyPublish": "Create your organiser account to add events to the agenda and design their flyers.",
  "org.gate.signIn": "Sign in",
  "org.gate.back": "← Back to the agenda",
  "org.gate.authClaim": "Claim your events",
  "org.gate.authPublish": "Publish your event",
  "org.auth.subtitle": "Create your organiser account. It's free to start.",
  "org.header.backLink": "← Public agenda",
  "org.header.titleAdmin": "All events",
  "org.header.titleMine": "My events",
  "org.header.adminBadge": "Admin",
  "org.header.descAdmin": "Manage any event (including ownerless ones from the bot).",
  "org.header.descMine": "Publish events on the agenda and design their flyers.",
  "org.header.newEvent": "New event",
  "org.loading": "Loading your events…",
  "org.section.drafts": "Drafts",
  "org.section.draftsHint": "Only you see them. Publish them so they appear on the agenda.",
  "org.section.upcoming": "Upcoming ({n})",
  "org.section.upcomingHint": "Published and still to come — visible on the agenda.",
  "org.section.upcomingEmpty": "You have no upcoming events. Press “New event” or send a flyer to the bot.",
  "org.section.past": "Past ({n})",
  "org.section.pastHint": "Already happened. They don't appear on the public agenda.",
  "org.section.cancelled": "Cancelled ({n})",
  "org.section.cancelledHint": "Still visible on the agenda with the CANCELLED seal. You can reactivate them.",
  "org.row.cancelShort": "Cancel.",
  "org.row.consult": "Ask",
  "org.row.free": "Free",
  "org.row.series": "🔁 series · {n} dates",
  "org.row.anon": "anonymous",
  "org.row.unpublish": "Unpublish",
  "org.row.publish": "Publish",
  "org.row.reactivate": "Reactivate event",
  "org.row.markCancelled": "Mark as cancelled",
  "org.row.edit": "Edit",
  "org.row.delete": "Delete",
  "org.delete.confirm": "Delete \"{title}\"? This action can't be undone.",
  "org.form.titleEdit": "Edit event",
  "org.form.titleNew": "New event",
  "org.form.errRequired": "Fill in at least the title, date and place.",
  "org.form.errUpload": "Couldn't upload the flyer",
  "org.form.errUploadGeneric": "Error uploading the flyer",
  "org.form.labelTitle": "Title *",
  "org.form.phTitle": "E.g. Summer concert",
  "org.form.labelDate": "Date *",
  "org.form.labelTime": "Time",
  "org.form.labelCity": "City",
  "org.form.labelCategory": "Category",
  "org.form.labelAudience": "Who it's for (optional)",
  "org.form.labelVenue": "Venue *",
  "org.form.phVenue": "E.g. Sala La Riviera",
  "org.form.labelNeighborhood": "Neighbourhood / area",
  "org.form.phNeighborhood": "E.g. Centre",
  "org.form.labelFlyer": "Event flyer",
  "org.form.uploading": "Uploading…",
  "org.form.changeFlyer": "Change flyer",
  "org.form.uploadFlyer": "Upload flyer",
  "org.form.noFlyer": "No flyer? Create it here",
  "org.form.labelPrice": "Price (€) — empty = ask · 0 = free",
  "org.form.phPrice": "from…",
  "org.form.labelPriceInfo": "Rates (if there are several)",
  "org.form.phPriceInfo": "Advance 12€ · Box office 15€",
  "org.form.onlineSale": "Online ticket sales?",
  "org.form.phTicketUrl": "https://… event or payment page",
  "org.form.labelDescription": "Description",
  "org.form.phDescription": "Event details…",
  "org.form.saveDraft": "Save draft",
  "org.form.publish": "Publish",
  "org.empty.title": "You don't have any events yet",
  "org.empty.body": "Create your first event and publish it on the public agenda in under a minute.",
  "org.empty.create": "Create event",
};

const fr: Dict = {
  "home.hero.title.line1": "Ton flyer pro",
  "home.hero.title.line2": "avec IA en 2 min pour",
  "home.hero.title.highlight": "votre événement",
  "home.hero.title.rotating": "votre fête, vos concerts, votre festival, vos cours de danse, votre discothèque, votre événement d'entreprise, votre académie, votre institution, votre école, votre maison de production, professeurs particuliers",
  "home.hero.subtitle": "Détoure, recadre et conçois ton flyer entier avec l'IA. Sans Photoshop, sans courbe d'apprentissage.",
  "home.hero.cta": "Commencer gratuitement",
  "home.hero.cta2": "Voir les modèles",
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
  "nav.projects": "Mes ressources",
  "nav.collaborators": "Collaborateurs",
  "nav.history": "Historique",
  "nav.pricing": "Tarifs",
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
  "auth.error.confirmationTimeout": "Nous n'avons pas pu détecter ta confirmation à temps. Connecte-toi manuellement avec ton email et ton mot de passe.",
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
  "mobileEditor.sheet.photo": "Photo",
  "mobileEditor.sheet.style": "Style",
  "mobileEditor.sheet.remix": "Remix · 4 styles",
  "mobileEditor.sheet.more": "Plus d'options",
  "mobileEditor.sheet.export": "Exporter",
  "mobileEditor.sheet.add": "Ajouter un élément",
  "mobileEditor.sheet.layers": "Calques",
  "mobileEditor.sheet.format": "Changer de format",
  "mobileEditor.sheet.assistant": "Assistant IA",
  "mobileEditor.photo.flyerPhotos": "Photos du flyer",
  "mobileEditor.photo.noPhotos": "Ce modèle n'a pas de photos.",
  "mobileEditor.photo.tapToEdit": "Touchez une photo pour l'éditer (remplacer, recadrer, filtres, opacité).",
  "mobileEditor.photo.uploadNew": "Importer une nouvelle photo",
  "mobileEditor.photo.uploadHint": "Ajoutée au centre du flyer et sélectionnée pour la déplacer.",
  "mobileEditor.toast.photoAddedFailed": "Impossible d'ajouter la photo",
  "mobileEditor.style.palettesFor": "Palettes pour",
  "mobileEditor.toast.paletteApplied": "Palette appliquée",
  "mobileEditor.remix.intro": "Appliquez un style complet (palette + police + effets) instantanément. Votre contenu est conservé.",
  "mobileEditor.remix.generateAI": "Générer avec l'IA",
  "mobileEditor.remix.beta": "Bêta",
  "mobileEditor.remix.surprise": "Surprenez-moi",
  "mobileEditor.remix.neon": "Néon",
  "mobileEditor.remix.elegant": "Élégant",
  "mobileEditor.remix.vintage": "Vintage",
  "mobileEditor.remix.curatedStyles": "Styles sélectionnés",
  "mobileEditor.remix.applied": "Appliqué",
  "mobileEditor.toast.styleApplied": "Style appliqué",
  "mobileEditor.toast.remixError": "Erreur de génération du remix",
  "mobileEditor.toast.rateLimitWait": "Trop de requêtes, attendez 1 min",
  "mobileEditor.more.myFlyers": "Mes flyers",
  "mobileEditor.more.myFlyersSub": "Retour à vos designs enregistrés",
  "mobileEditor.more.viewTutorial": "Voir le tutoriel",
  "mobileEditor.more.viewTutorialSub": "Revoir le guide rapide de l'éditeur",
  "mobileEditor.more.layers": "Calques",
  "mobileEditor.more.layersSub": "Voir et organiser les éléments",
  "mobileEditor.more.aiAssistant": "Assistant IA",
  "mobileEditor.more.aiAssistantSub": "Décrivez votre événement et remplissez le flyer",
  "mobileEditor.more.changeFormat": "Changer de format",
  "mobileEditor.more.changeFormatSub": "Story 9:16, Post 4:5, etc.",
  "mobileEditor.more.resetTemplate": "Réinitialiser le modèle",
  "mobileEditor.more.resetTemplateSub": "Revenir au design original",
  "mobileEditor.more.comingSoon": "Bientôt",
  "mobileEditor.export.fileType": "Type de fichier",
  "mobileEditor.export.png": "PNG",
  "mobileEditor.export.jpg": "JPG",
  "mobileEditor.export.pdf": "PDF",
  "mobileEditor.export.svg": "SVG",
  "mobileEditor.export.pngSubtitle": "Qualité max",
  "mobileEditor.export.jpgSubtitle": "Léger",
  "mobileEditor.export.pdfSubtitle": "Impression",
  "mobileEditor.export.svgSubtitle": "Vectoriel",
  "mobileEditor.export.pngHelp": "PNG sans perte. Texte net et bordures parfaites. Idéal pour imprimer ou Instagram en HD.",
  "mobileEditor.export.jpgHelp": "JPG compressé (~5× plus léger). Idéal WhatsApp et rapidité. Peut montrer des artéfacts sur le texte fin.",
  "mobileEditor.export.pdfHelp": "PDF pour impression professionnelle. Taille réelle en mm, qualité d'impression.",
  "mobileEditor.export.svgHelp": "SVG vectoriel. Éditable dans Illustrator/Figma/Inkscape sans perte. Les réseaux sociaux peuvent ne pas l'accepter.",
  "mobileEditor.export.templateHas": "Ce modèle a",
  "mobileEditor.export.textsMaintained": "Les textes édités sont conservés lors du changement de format.",
  "mobileEditor.export.edited": "Édité",
  "mobileEditor.export.download": "Télécharger",
  "mobileEditor.export.downloadAll": "Tout télécharger",
  "mobileEditor.export.exporting": "Exportation…",
  "mobileEditor.export.notice": "Les autres formats sont rendus avec la mise en page d'origine — palette, remix et images uploadées sont préservés uniquement dans le format actuel.",
  "mobileEditor.toast.downloaded": "Téléchargé",
  "mobileEditor.toast.downloadedSvg": "SVG vectoriel téléchargé",
  "mobileEditor.toast.downloadedPdf": "PDF d'impression téléchargé",
  "mobileEditor.toast.exportError": "Erreur de rendu",
  "mobileEditor.toast.allDownloaded": "Tous les formats téléchargés",
  "mobileEditor.share.title": "Partager le flyer",
  "mobileEditor.share.downloadedOk": "Téléchargé avec succès",
  "mobileEditor.share.systemShare": "Partager avec l'application système",
  "mobileEditor.share.orChoose": "Ou choisissez un réseau",
  "mobileEditor.share.whatsapp": "WhatsApp",
  "mobileEditor.share.instagram": "Instagram",
  "mobileEditor.share.facebook": "Facebook",
  "mobileEditor.share.twitter": "Twitter",
  "mobileEditor.share.telegram": "Telegram",
  "mobileEditor.share.email": "Email",
  "mobileEditor.share.copyLink": "Copier le lien",
  "mobileEditor.share.copied": "Copié ✓",
  "mobileEditor.share.redownload": "Re-télécharger",
  "mobileEditor.share.privateUrl": "Votre flyer est publié à une URL privée. Seuls ceux qui reçoivent le lien peuvent le voir.",
  "mobileEditor.share.message": "Regarde le flyer que j'ai fait avec ArteGenIA 🎨",
  "mobileEditor.share.credit": "Créé avec ArteGenIA — artegenia.vercel.app",
  "mobileEditor.share.igTitle": "Partager sur Instagram",
  "mobileEditor.share.igIntro": "Instagram n'autorise pas le partage depuis le web automatiquement. Suivez ces 3 étapes :",
  "mobileEditor.share.igStep1": "Le flyer est déjà téléchargé dans votre galerie.",
  "mobileEditor.share.igStep2": "Ouvrez Instagram → touchez le + en haut.",
  "mobileEditor.share.igStep3": "Choisissez Story ou Publication et sélectionnez le flyer.",
  "mobileEditor.share.igOpen": "Ouvrir Instagram",
  "mobileEditor.share.close": "Fermer",
  "mobileEditor.toast.shareUploadFailed": "Impossible de préparer le lien",
  "mobileEditor.toast.loginToShare": "Connectez-vous pour partager",
  "mobileEditor.layers.intro": "Les calques sont affichés dans l'ordre — le supérieur apparaît au-dessus des autres.",
  "mobileEditor.layers.empty": "Ce flyer n'a pas encore de calques modifiables.",
  "mobileEditor.layers.emptyHint": "Utilisez le bouton \"Ajouter\" ci-dessous pour créer des éléments.",
  "mobileEditor.layers.aria.up": "Avancer le calque",
  "mobileEditor.layers.aria.down": "Reculer le calque",
  "mobileEditor.layers.aria.show": "Afficher",
  "mobileEditor.layers.aria.hide": "Masquer",
  "mobileEditor.layers.fallback.text": "Texte",
  "mobileEditor.layers.fallback.image": "Image",
  "mobileEditor.layers.fallback.rect": "Rectangle",
  "mobileEditor.layers.fallback.circle": "Cercle",
  "mobileEditor.layers.fallback.triangle": "Triangle",
  "mobileEditor.layers.fallback.shape": "Forme",
  "mobileEditor.changeFormat.intro": "Changez la taille et la proportion du flyer en gardant le contenu. Si vous avez des modifications non enregistrées, elles sont enregistrées avant.",
  "mobileEditor.changeFormat.current": "Actuel",
  "mobileEditor.changeFormat.noVariant": "Ce modèle n'a pas le format",
  "mobileEditor.add.textSection": "Texte",
  "mobileEditor.add.shapesSection": "Formes",
  "mobileEditor.add.imageSection": "Image",
  "mobileEditor.add.title": "Titre",
  "mobileEditor.add.subtitle": "Sous-titre",
  "mobileEditor.add.body": "Corps",
  "mobileEditor.add.rect": "Rect",
  "mobileEditor.add.circle": "Cercle",
  "mobileEditor.add.triangle": "Triang.",
  "mobileEditor.add.heart": "Cœur",
  "mobileEditor.add.star": "Étoile",
  "mobileEditor.add.line": "Ligne",
  "mobileEditor.add.uploadPhoto": "Importer une photo de votre galerie",
  "mobileEditor.add.hint": "L'élément est ajouté centré et sélectionné pour l'éditer.",
  "mobileEditor.assistant.loginTitle": "Connectez-vous pour utiliser l'IA",
  "mobileEditor.assistant.loginDesc": "L'Assistant IA remplit votre flyer automatiquement à partir d'une description. Nous devons vous identifier pour le protéger. C'est gratuit.",
  "mobileEditor.assistant.loginBtn": "Se connecter",
  "mobileEditor.assistant.loginFooter": "Vos designs ne sont pas perdus — ils attendent dans cet éditeur pendant que vous vous connectez.",
  "mobileEditor.assistant.headerTitle": "Décrivez votre événement en 1 phrase",
  "mobileEditor.assistant.headerDesc": "L'IA remplit automatiquement tous les champs du flyer.",
  "mobileEditor.assistant.placeholder": "Ex : Cours de bachata samedi 22 novembre 16-20h au Studio Kiz Madrid, 70€ early bird 60€",
  "mobileEditor.assistant.examples": "Exemples rapides",
  "mobileEditor.assistant.generating": "Génération…",
  "mobileEditor.assistant.generate": "Générer avec l'IA",
  "mobileEditor.assistant.poweredBy": "Propulsé par Claude Haiku · 10 générations par minute",
  "mobileEditor.assistant.previewTitle": "Aperçu généré par l'IA",
  "mobileEditor.assistant.previewDesc": "Vérifiez que les données sont correctes. Quand vous êtes prêt, appuyez sur \"Appliquer au flyer\".",
  "mobileEditor.assistant.retry": "Réessayer",
  "mobileEditor.assistant.apply": "Appliquer au flyer",
  "mobileEditor.assistant.emptyValue": "(vide)",
  "mobileEditor.toast.assistantApplied": "Champs remplis par l'IA",
  "mobileEditor.toast.assistantError": "L'IA n'a pas pu générer le flyer",
  "mobileEditor.toast.assistantEmpty": "L'IA n'a renvoyé aucune valeur — essayez une autre description",
  "mobileEditor.toast.assistantNeedPrompt": "Écrivez d'abord l'événement",
  "mobileEditor.onb.step1Title": "Touchez le texte pour l'éditer",
  "mobileEditor.onb.step1Body": "N'importe quel texte du flyer est modifiable. Changez le nom de l'événement, la date, le prix... Touchez et tapez.",
  "mobileEditor.onb.step2Title": "Ajoutez des éléments avec +",
  "mobileEditor.onb.step2Body": "Appuyez sur le bouton Ajouter pour insérer du texte, des formes, étoiles, cœurs ou vos propres photos.",
  "mobileEditor.onb.step3Title": "Changez de style en 1 tap",
  "mobileEditor.onb.step3Body": "Style applique des palettes sélectionnées. Remix génère des variantes avec l'IA. Partagez sur WhatsApp, Instagram et plus.",
  "mobileEditor.onb.step4Title": "Exporter et partager",
  "mobileEditor.onb.step4Body": "Quand c'est prêt, appuyez sur Exporter en haut. Choisissez PNG, JPG, PDF impression ou SVG vectoriel. Puis partagez en 1 tap.",
  "mobileEditor.onb.skip": "Passer",
  "mobileEditor.onb.next": "Suivant",
  "mobileEditor.onb.start": "Commencer",
  // ── AGENDA EVENTOS ──
  "eventos.cat.fiesta": "Fête",
  "eventos.cat.conciertos": "Concerts",
  "eventos.cat.festival": "Festival",
  "eventos.cat.clases": "Cours de danse",
  "eventos.cat.club": "Club / Discothèque",
  "eventos.cat.corporativo": "Entreprise",
  "eventos.cat.social": "Bals sociaux",
  "eventos.cat.teatro": "Théâtre",
  "eventos.aud.academias": "Académies",
  "eventos.aud.productoras": "Sociétés de production",
  "eventos.aud.freelance": "Freelance",
  "eventos.aud.instituciones": "Institutions",
  "eventos.aud.agencias": "Agences",
  "eventos.aud.colegios": "Écoles",
  "eventos.city.todas": "Toutes les villes",
  "eventos.date.todos": "Tous",
  "eventos.date.hoy": "Aujourd'hui",
  "eventos.date.manana": "Demain",
  "eventos.date.finde": "Ce week-end",
  "eventos.date.semana": "Cette semaine",
  "eventos.date.mes": "Ce mois-ci",
  "eventos.date.rango": "Période",
  "eventos.topbar.brand": "Agenda",
  "eventos.topbar.shareAria": "Partager l'agenda",
  "eventos.topbar.shareCopied": "Lien copié !",
  "eventos.topbar.share": "Partager",
  "eventos.topbar.publishShort": "Publier",
  "eventos.topbar.uploadShort": "Ajoute ton événement",
  "eventos.organizer.publish": "Publier l'événement",
  "eventos.organizer.uploadFree": "Ajoute ton événement gratuitement",
  "eventos.hero.badge": "Agenda culturel public",
  "eventos.hero.titleMobile": "Sorties culturelles à ",
  "eventos.hero.titleDesktop": "Que faire à ",
  "eventos.hero.subtitle": "Concerts, expositions, théâtre et plus près de toi.",
  "eventos.country.soon": "bientôt",
  "eventos.search.placeholder": "Cherche des événements, salles ou quartiers",
  "eventos.search.nearMe": "Près de moi",
  "eventos.geo.unsupported": "Ton navigateur n'autorise pas la localisation",
  "eventos.geo.showing": "Affichage de {place}",
  "eventos.geo.noneNearby": "Pas encore d'événements près de toi",
  "eventos.geo.failed": "Impossible d'obtenir ta localisation",
  "eventos.geo.errorPrompt": "{msg} · saisis ta ville :",
  "eventos.filters.free": "Gratuit",
  "eventos.filters.nearMe": "Près de moi",
  "eventos.filters.more": "Plus de filtres",
  "eventos.view.lista": "Liste",
  "eventos.view.calendario": "Calendrier",
  "eventos.filters.whenLabel": "Quand",
  "eventos.filters.categoryLabel": "Catégorie",
  "eventos.filters.audienceLabel": "Pour qui",
  "eventos.filters.saved": "Enregistrés",
  "eventos.range.from": "Du",
  "eventos.range.to": "au",
  "eventos.count.one": "événement",
  "eventos.count.many": "événements",
  "eventos.count.in": "à",
  "eventos.count.mockBadge": "exemples de démonstration",
  "eventos.cityauto.placeholder": "Saisis ta ville…",
  "eventos.cityauto.empty": "Pas encore d'événements là-bas. Essaie Madrid, Barcelone, Valence…",
  "eventos.band.titleHas": "Un nouvel événement ?",
  "eventos.band.titleOrg": "Tu organises des événements ?",
  "eventos.band.descHas": "Publie-le sur l'agenda et crée son flyer en quelques minutes avec ton compte.",
  "eventos.band.descOrg": "Publie ton événement sur l'agenda et crée son flyer en quelques minutes. Gratuit pour commencer.",
  "eventos.band.ctaHas": "Publier l'événement",
  "eventos.band.ctaOrg": "Ajoute ton événement gratuitement",
  "eventos.auth.title": "Publie ton événement",
  "eventos.auth.subtitle": "Crée ton compte organisateur. C'est gratuit pour commencer.",
  "eventos.publish.titleHas": "Publie ton événement",
  "eventos.publish.titleOrg": "Ajoute ton événement gratuitement",
  "eventos.publish.subtitle": "Choisis la voie la plus rapide pour toi. Envoie le flyer et on lit la date, le lieu et le prix.",
  "eventos.publish.close": "Fermer",
  "eventos.publish.web.title": "Ici même (assistant)",
  "eventos.publish.web.fast": "RAPIDE",
  "eventos.publish.web.descHas": "Téléverse le flyer et tout se remplit tout seul. Tu vas directement à ton tableau de bord.",
  "eventos.publish.web.descOrg": "Téléverse le flyer et tout se remplit tout seul. Crée ton compte gratuit en quelques secondes.",
  "eventos.publish.telegram.title": "Par Telegram",
  "eventos.publish.telegram.noAccount": "SANS COMPTE",
  "eventos.publish.telegram.desc": "Envoie le flyer au bot et il se publie tout seul. Tes événements t'attendent si tu ouvres un compte plus tard.",
  "eventos.publish.telegram.soonDesc": "Activation du bot — disponible très bientôt.",
  "eventos.publish.whatsapp.title": "Par WhatsApp",
  "eventos.publish.whatsapp.desc": "Bientôt : le même bot, sur ton WhatsApp.",
  "eventos.publish.voice.title": "Par la voix",
  "eventos.publish.voice.desc": "Bientôt : raconte ton événement avec un audio.",
  "eventos.publish.soonBadge": "BIENTÔT",
  "eventos.list.today": "Aujourd'hui · ",
  "eventos.list.seeAll": "Voir tout",
  "eventos.card.consult": "À confirmer",
  "eventos.card.free": "Gratuit",
  "eventos.card.priceFrom": "à partir de ",
  "eventos.card.removeFav": "Retirer des enregistrés",
  "eventos.card.addFav": "Enregistrer l'événement",
  "eventos.card.cancelled": "Annulé",
  "eventos.card.tickets": "Billets",
  "eventos.card.seeEvent": "Voir l'événement",
  "eventos.cal.more": "+{n} de plus",
  "eventos.cal.legend": "Légende",
  "eventos.rsvp.join": "J'y vais",
  "eventos.rsvp.joined": "Tu y es !",
  "eventos.rsvp.count": "{n} participants",
  "eventos.stats.week": "cette semaine",
  "eventos.stats.free": "gratuits",
  "eventos.stats.attending": "participants",
  "eventos.stats.summary": "Résumé",
  "eventos.featured.title": "À la une",
  "eventos.featured.popular": "Populaire aujourd'hui",
  "eventos.featured.see": "Voir l'événement",
  "eventos.modal.seeFlyer": "Voir le flyer",
  "eventos.modal.priceTbc": "Prix à confirmer",
  "eventos.modal.priceFree": "Entrée gratuite",
  "eventos.modal.timeSuffix": "h",
  "eventos.modal.saved": "Enregistré",
  "eventos.modal.save": "Enregistrer",
  "eventos.modal.copied": "Copié !",
  "eventos.modal.share": "Partager",
  "eventos.modal.buyOnline": "Acheter des billets en ligne",
  "eventos.modal.freeEntry": "Entrée libre — pas besoin de réserver",
  "eventos.modal.consultOrganizer": "Demande le prix à l'organisateur",
  "eventos.modal.boxOffice": "Billets à la caisse",
  "eventos.lightbox.close": "Fermer",
  "eventos.seal.cancelled": "Annulé",
  "eventos.empty.title": "Aucun événement avec ces filtres",
  "eventos.empty.body": "Essaie de changer la ville, les dates ou de retirer un filtre.",
  "eventos.empty.reset": "Réinitialiser les filtres",
  // ── PANEL ORGANIZADOR ──
  "org.cat.fiesta": "Fête",
  "org.cat.conciertos": "Concerts",
  "org.cat.festival": "Festival",
  "org.cat.clases": "Cours de danse",
  "org.cat.club": "Club / Discothèque",
  "org.cat.corporativo": "Entreprise",
  "org.cat.social": "Bals sociaux",
  "org.cat.teatro": "Théâtre",
  "org.aud.academias": "Académies",
  "org.aud.productoras": "Sociétés de production",
  "org.aud.freelance": "Freelance",
  "org.aud.instituciones": "Institutions",
  "org.aud.agencias": "Agences",
  "org.aud.colegios": "Écoles",
  "org.claim.success": "✅ Tu as réclamé {n} {events} envoyés par le bot.",
  "org.gate.titleClaim": "Connecte-toi pour réclamer tes événements",
  "org.gate.titlePublish": "Connecte-toi pour publier des événements",
  "org.gate.bodyClaim": "Les flyers que tu as envoyés via le bot sont déjà publiés. Ouvre ton compte pour les gérer.",
  "org.gate.bodyPublish": "Crée ton compte organisateur pour ajouter des événements à l'agenda et concevoir leurs flyers.",
  "org.gate.signIn": "Se connecter",
  "org.gate.back": "← Retour à l'agenda",
  "org.gate.authClaim": "Réclame tes événements",
  "org.gate.authPublish": "Publie ton événement",
  "org.auth.subtitle": "Crée ton compte organisateur. C'est gratuit pour commencer.",
  "org.header.backLink": "← Agenda public",
  "org.header.titleAdmin": "Tous les événements",
  "org.header.titleMine": "Mes événements",
  "org.header.adminBadge": "Admin",
  "org.header.descAdmin": "Gère n'importe quel événement (y compris ceux du bot sans propriétaire).",
  "org.header.descMine": "Publie des événements sur l'agenda et conçois leurs flyers.",
  "org.header.newEvent": "Nouvel événement",
  "org.loading": "Chargement de tes événements…",
  "org.section.drafts": "Brouillons",
  "org.section.draftsHint": "Toi seul les vois. Publie-les pour qu'ils apparaissent sur l'agenda.",
  "org.section.upcoming": "À venir ({n})",
  "org.section.upcomingHint": "Publiés et encore à venir — visibles sur l'agenda.",
  "org.section.upcomingEmpty": "Tu n'as aucun événement à venir. Appuie sur « Nouvel événement » ou envoie un flyer au bot.",
  "org.section.past": "Passés ({n})",
  "org.section.pastHint": "Déjà passés. Ils n'apparaissent pas sur l'agenda public.",
  "org.section.cancelled": "Annulés ({n})",
  "org.section.cancelledHint": "Toujours visibles sur l'agenda avec le tampon ANNULÉ. Tu peux les réactiver.",
  "org.row.cancelShort": "Annul.",
  "org.row.consult": "À confirmer",
  "org.row.free": "Gratuit",
  "org.row.series": "🔁 série · {n} dates",
  "org.row.anon": "anonyme",
  "org.row.unpublish": "Dépublier",
  "org.row.publish": "Publier",
  "org.row.reactivate": "Réactiver l'événement",
  "org.row.markCancelled": "Marquer comme annulé",
  "org.row.edit": "Modifier",
  "org.row.delete": "Supprimer",
  "org.delete.confirm": "Supprimer « {title} » ? Cette action est irréversible.",
  "org.form.titleEdit": "Modifier l'événement",
  "org.form.titleNew": "Nouvel événement",
  "org.form.errRequired": "Renseigne au moins le titre, la date et le lieu.",
  "org.form.errUpload": "Impossible de téléverser le flyer",
  "org.form.errUploadGeneric": "Erreur lors du téléversement du flyer",
  "org.form.labelTitle": "Titre *",
  "org.form.phTitle": "Ex. Concert d'été",
  "org.form.labelDate": "Date *",
  "org.form.labelTime": "Heure",
  "org.form.labelCity": "Ville",
  "org.form.labelCategory": "Catégorie",
  "org.form.labelAudience": "Pour qui (facultatif)",
  "org.form.labelVenue": "Lieu / salle *",
  "org.form.phVenue": "Ex. Sala La Riviera",
  "org.form.labelNeighborhood": "Quartier / zone",
  "org.form.phNeighborhood": "Ex. Centre",
  "org.form.labelFlyer": "Flyer de l'événement",
  "org.form.uploading": "Téléversement…",
  "org.form.changeFlyer": "Changer le flyer",
  "org.form.uploadFlyer": "Téléverser un flyer",
  "org.form.noFlyer": "Pas de flyer ? Crée-le ici",
  "org.form.labelPrice": "Prix (€) — vide = à confirmer · 0 = gratuit",
  "org.form.phPrice": "à partir de…",
  "org.form.labelPriceInfo": "Tarifs (s'il y en a plusieurs)",
  "org.form.phPriceInfo": "Prévente 12€ · Caisse 15€",
  "org.form.onlineSale": "Vente de billets en ligne ?",
  "org.form.phTicketUrl": "https://… page de l'événement ou de paiement",
  "org.form.labelDescription": "Description",
  "org.form.phDescription": "Détails de l'événement…",
  "org.form.saveDraft": "Enregistrer le brouillon",
  "org.form.publish": "Publier",
  "org.empty.title": "Tu n'as pas encore d'événements",
  "org.empty.body": "Crée ton premier événement et publie-le sur l'agenda public en moins d'une minute.",
  "org.empty.create": "Créer un événement",
};

const pt: Dict = {
  "home.hero.title.line1": "O teu flyer pro",
  "home.hero.title.line2": "com IA em 2 min para",
  "home.hero.title.highlight": "o teu evento",
  "home.hero.title.rotating": "a tua festa, os teus concertos, o teu festival, as tuas aulas de dança, a tua discoteca, o teu evento corporativo, a tua academia, a tua instituição, o teu colégio, a tua produtora, professores particulares",
  "home.hero.subtitle": "Remove fundos, recorta pessoas e desenha o flyer inteiro com IA. Sem Photoshop, sem curva de aprendizagem.",
  "home.hero.cta": "Começar grátis",
  "home.hero.cta2": "Ver modelos",
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
  "nav.projects": "Meus recursos",
  "nav.collaborators": "Colaboradores",
  "nav.history": "Histórico",
  "nav.pricing": "Preços",
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
  "auth.error.confirmationTimeout": "Não conseguimos detetar a tua confirmação a tempo. Inicia sessão manualmente com o teu email e palavra-passe.",
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
  "mobileEditor.sheet.photo": "Foto",
  "mobileEditor.sheet.style": "Estilo",
  "mobileEditor.sheet.remix": "Remix · 4 estilos",
  "mobileEditor.sheet.more": "Mais opções",
  "mobileEditor.sheet.export": "Exportar",
  "mobileEditor.sheet.add": "Adicionar elemento",
  "mobileEditor.sheet.layers": "Camadas",
  "mobileEditor.sheet.format": "Mudar formato",
  "mobileEditor.sheet.assistant": "Assistente IA",
  "mobileEditor.photo.flyerPhotos": "Fotos do flyer",
  "mobileEditor.photo.noPhotos": "Este modelo não tem fotos.",
  "mobileEditor.photo.tapToEdit": "Toque numa foto para editar (substituir, recortar, filtros, opacidade).",
  "mobileEditor.photo.uploadNew": "Carregar nova foto",
  "mobileEditor.photo.uploadHint": "Adicionada no centro do flyer e selecionada para mover.",
  "mobileEditor.toast.photoAddedFailed": "Não foi possível adicionar a foto",
  "mobileEditor.style.palettesFor": "Paletas para",
  "mobileEditor.toast.paletteApplied": "Paleta aplicada",
  "mobileEditor.remix.intro": "Aplique um estilo completo (paleta + fonte + efeitos) num instante. O conteúdo é mantido.",
  "mobileEditor.remix.generateAI": "Gerar com IA",
  "mobileEditor.remix.beta": "Beta",
  "mobileEditor.remix.surprise": "Surpreenda-me",
  "mobileEditor.remix.neon": "Néon",
  "mobileEditor.remix.elegant": "Elegante",
  "mobileEditor.remix.vintage": "Vintage",
  "mobileEditor.remix.curatedStyles": "Estilos curados",
  "mobileEditor.remix.applied": "Aplicado",
  "mobileEditor.toast.styleApplied": "Estilo aplicado",
  "mobileEditor.toast.remixError": "Erro ao gerar remix",
  "mobileEditor.toast.rateLimitWait": "Muitos pedidos, aguarde 1 min",
  "mobileEditor.more.myFlyers": "Meus flyers",
  "mobileEditor.more.myFlyersSub": "Voltar aos designs guardados",
  "mobileEditor.more.viewTutorial": "Ver tutorial",
  "mobileEditor.more.viewTutorialSub": "Rever o guia rápido do editor",
  "mobileEditor.more.layers": "Camadas",
  "mobileEditor.more.layersSub": "Ver e organizar elementos",
  "mobileEditor.more.aiAssistant": "Assistente IA",
  "mobileEditor.more.aiAssistantSub": "Descreva o seu evento e preencha o flyer",
  "mobileEditor.more.changeFormat": "Mudar formato",
  "mobileEditor.more.changeFormatSub": "Story 9:16, Post 4:5, etc.",
  "mobileEditor.more.resetTemplate": "Reiniciar modelo",
  "mobileEditor.more.resetTemplateSub": "Voltar ao design original",
  "mobileEditor.more.comingSoon": "Em breve",
  "mobileEditor.export.fileType": "Tipo de ficheiro",
  "mobileEditor.export.png": "PNG",
  "mobileEditor.export.jpg": "JPG",
  "mobileEditor.export.pdf": "PDF",
  "mobileEditor.export.svg": "SVG",
  "mobileEditor.export.pngSubtitle": "Qualidade máx",
  "mobileEditor.export.jpgSubtitle": "Leve",
  "mobileEditor.export.pdfSubtitle": "Impressão",
  "mobileEditor.export.svgSubtitle": "Vetorial",
  "mobileEditor.export.pngHelp": "PNG sem perda. Texto nítido e bordas perfeitas. Ideal imprimir ou Instagram em alta.",
  "mobileEditor.export.jpgHelp": "JPG comprimido (~5× mais leve). Ideal WhatsApp e rapidez. Pode mostrar artefactos em texto fino.",
  "mobileEditor.export.pdfHelp": "PDF para impressão profissional. Tamanho real em mm, qualidade de impressão.",
  "mobileEditor.export.svgHelp": "SVG vetorial. Editável em Illustrator/Figma/Inkscape sem perda. Redes sociais podem não aceitar.",
  "mobileEditor.export.templateHas": "Este modelo tem",
  "mobileEditor.export.textsMaintained": "Os textos editados são mantidos ao mudar de formato.",
  "mobileEditor.export.edited": "Editado",
  "mobileEditor.export.download": "Descarregar",
  "mobileEditor.export.downloadAll": "Descarregar tudo",
  "mobileEditor.export.exporting": "A exportar…",
  "mobileEditor.export.notice": "Os outros formatos são renderizados com o layout original — paleta, remix e imagens carregadas só são preservados no formato atual.",
  "mobileEditor.toast.downloaded": "Descarregado",
  "mobileEditor.toast.downloadedSvg": "SVG vetorial descarregado",
  "mobileEditor.toast.downloadedPdf": "PDF de impressão descarregado",
  "mobileEditor.toast.exportError": "Erro de renderização",
  "mobileEditor.toast.allDownloaded": "Todos os formatos descarregados",
  "mobileEditor.share.title": "Partilhar flyer",
  "mobileEditor.share.downloadedOk": "Descarregado com sucesso",
  "mobileEditor.share.systemShare": "Partilhar com aplicação do sistema",
  "mobileEditor.share.orChoose": "Ou escolha uma rede",
  "mobileEditor.share.whatsapp": "WhatsApp",
  "mobileEditor.share.instagram": "Instagram",
  "mobileEditor.share.facebook": "Facebook",
  "mobileEditor.share.twitter": "Twitter",
  "mobileEditor.share.telegram": "Telegram",
  "mobileEditor.share.email": "Email",
  "mobileEditor.share.copyLink": "Copiar link",
  "mobileEditor.share.copied": "Copiado ✓",
  "mobileEditor.share.redownload": "Re-descarregar",
  "mobileEditor.share.privateUrl": "O seu flyer é publicado num URL privado. Só quem recebe o link pode vê-lo.",
  "mobileEditor.share.message": "Vê o flyer que fiz com ArteGenIA 🎨",
  "mobileEditor.share.credit": "Criado com ArteGenIA — artegenia.vercel.app",
  "mobileEditor.share.igTitle": "Partilhar no Instagram",
  "mobileEditor.share.igIntro": "O Instagram não permite partilhar pela web automaticamente. Siga estes 3 passos:",
  "mobileEditor.share.igStep1": "Já tem o flyer descarregado na galeria.",
  "mobileEditor.share.igStep2": "Abra Instagram → toque no + em cima.",
  "mobileEditor.share.igStep3": "Escolha Story ou Publicação e selecione o flyer.",
  "mobileEditor.share.igOpen": "Abrir Instagram",
  "mobileEditor.share.close": "Fechar",
  "mobileEditor.toast.shareUploadFailed": "Não foi possível preparar o link",
  "mobileEditor.toast.loginToShare": "Inicie sessão para partilhar",
  "mobileEditor.layers.intro": "As camadas são mostradas em ordem — a superior aparece sobre as restantes.",
  "mobileEditor.layers.empty": "Este flyer ainda não tem camadas editáveis.",
  "mobileEditor.layers.emptyHint": "Use o botão \"Adicionar\" abaixo para criar elementos.",
  "mobileEditor.layers.aria.up": "Subir camada",
  "mobileEditor.layers.aria.down": "Descer camada",
  "mobileEditor.layers.aria.show": "Mostrar",
  "mobileEditor.layers.aria.hide": "Ocultar",
  "mobileEditor.layers.fallback.text": "Texto",
  "mobileEditor.layers.fallback.image": "Imagem",
  "mobileEditor.layers.fallback.rect": "Retângulo",
  "mobileEditor.layers.fallback.circle": "Círculo",
  "mobileEditor.layers.fallback.triangle": "Triângulo",
  "mobileEditor.layers.fallback.shape": "Forma",
  "mobileEditor.changeFormat.intro": "Mude o tamanho e proporção do flyer mantendo o conteúdo. Se tiver alterações não guardadas, são guardadas antes.",
  "mobileEditor.changeFormat.current": "Atual",
  "mobileEditor.changeFormat.noVariant": "Este modelo não tem formato",
  "mobileEditor.add.textSection": "Texto",
  "mobileEditor.add.shapesSection": "Formas",
  "mobileEditor.add.imageSection": "Imagem",
  "mobileEditor.add.title": "Título",
  "mobileEditor.add.subtitle": "Subtítulo",
  "mobileEditor.add.body": "Corpo",
  "mobileEditor.add.rect": "Rect",
  "mobileEditor.add.circle": "Círculo",
  "mobileEditor.add.triangle": "Triâng.",
  "mobileEditor.add.heart": "Coração",
  "mobileEditor.add.star": "Estrela",
  "mobileEditor.add.line": "Linha",
  "mobileEditor.add.uploadPhoto": "Carregar foto da galeria",
  "mobileEditor.add.hint": "O elemento é adicionado centrado e selecionado para editar.",
  "mobileEditor.assistant.loginTitle": "Inicie sessão para usar a IA",
  "mobileEditor.assistant.loginDesc": "O Assistente IA preenche o flyer automaticamente a partir de uma descrição. Precisamos identificá-lo para proteger contra abuso. É grátis.",
  "mobileEditor.assistant.loginBtn": "Iniciar sessão",
  "mobileEditor.assistant.loginFooter": "Os designs não se perdem — aguardam neste editor enquanto inicia sessão.",
  "mobileEditor.assistant.headerTitle": "Descreva o seu evento em 1 frase",
  "mobileEditor.assistant.headerDesc": "A IA preenche automaticamente todos os campos do flyer.",
  "mobileEditor.assistant.placeholder": "Ex: Aula de bachata sábado 22 novembro 16-20h em Studio Kiz Madrid, 70€ early bird 60€",
  "mobileEditor.assistant.examples": "Exemplos rápidos",
  "mobileEditor.assistant.generating": "A gerar…",
  "mobileEditor.assistant.generate": "Gerar com IA",
  "mobileEditor.assistant.poweredBy": "Powered by Claude Haiku · 10 gerações por minuto",
  "mobileEditor.assistant.previewTitle": "Pré-visualização gerada pela IA",
  "mobileEditor.assistant.previewDesc": "Verifique se os dados estão corretos. Quando estiver pronto, toque em \"Aplicar ao flyer\".",
  "mobileEditor.assistant.retry": "Tentar novamente",
  "mobileEditor.assistant.apply": "Aplicar ao flyer",
  "mobileEditor.assistant.emptyValue": "(vazio)",
  "mobileEditor.toast.assistantApplied": "Campos preenchidos pela IA",
  "mobileEditor.toast.assistantError": "A IA não conseguiu gerar o flyer",
  "mobileEditor.toast.assistantEmpty": "A IA não devolveu valores — tente outra descrição",
  "mobileEditor.toast.assistantNeedPrompt": "Escreva primeiro o evento",
  "mobileEditor.onb.step1Title": "Toque no texto para editar",
  "mobileEditor.onb.step1Body": "Qualquer texto do flyer é editável. Mude o nome do evento, data, preço... Basta tocar e escrever.",
  "mobileEditor.onb.step2Title": "Adicione elementos com +",
  "mobileEditor.onb.step2Body": "Toque no botão Adicionar abaixo para inserir novo texto, formas, estrelas, corações ou as suas próprias fotos.",
  "mobileEditor.onb.step3Title": "Mude o estilo em 1 toque",
  "mobileEditor.onb.step3Body": "Estilo aplica paletas curadas. Remix gera variantes com IA. Partilhe no WhatsApp, Instagram e mais.",
  "mobileEditor.onb.step4Title": "Exportar e partilhar",
  "mobileEditor.onb.step4Body": "Quando pronto, toque em Exportar em cima. Escolha PNG, JPG, PDF impressão ou SVG vetorial. Depois partilhe num toque.",
  "mobileEditor.onb.skip": "Saltar",
  "mobileEditor.onb.next": "Seguinte",
  "mobileEditor.onb.start": "Começar",
  // ── AGENDA EVENTOS ──
  "eventos.cat.fiesta": "Festa",
  "eventos.cat.conciertos": "Concertos",
  "eventos.cat.festival": "Festival",
  "eventos.cat.clases": "Aulas de dança",
  "eventos.cat.club": "Club / Discoteca",
  "eventos.cat.corporativo": "Corporativo",
  "eventos.cat.social": "Bailes sociais",
  "eventos.cat.teatro": "Teatro",
  "eventos.aud.academias": "Academias",
  "eventos.aud.productoras": "Produtoras",
  "eventos.aud.freelance": "Freelance",
  "eventos.aud.instituciones": "Instituições",
  "eventos.aud.agencias": "Agências",
  "eventos.aud.colegios": "Escolas",
  "eventos.city.todas": "Todas as cidades",
  "eventos.date.todos": "Todos",
  "eventos.date.hoy": "Hoje",
  "eventos.date.manana": "Amanhã",
  "eventos.date.finde": "Este fim de semana",
  "eventos.date.semana": "Esta semana",
  "eventos.date.mes": "Este mês",
  "eventos.date.rango": "Intervalo",
  "eventos.topbar.brand": "Agenda",
  "eventos.topbar.shareAria": "Partilhar a agenda",
  "eventos.topbar.shareCopied": "Link copiado!",
  "eventos.topbar.share": "Partilhar",
  "eventos.topbar.publishShort": "Publicar",
  "eventos.topbar.uploadShort": "Publica o teu evento",
  "eventos.organizer.publish": "Publicar evento",
  "eventos.organizer.uploadFree": "Publica o teu evento grátis",
  "eventos.hero.badge": "Agenda cultural pública",
  "eventos.hero.titleMobile": "Planos culturais em ",
  "eventos.hero.titleDesktop": "Que planos há em ",
  "eventos.hero.subtitle": "Concertos, exposições, teatro e mais perto de ti.",
  "eventos.country.soon": "em breve",
  "eventos.search.placeholder": "Procura eventos, salas ou bairros",
  "eventos.search.nearMe": "Perto de mim",
  "eventos.geo.unsupported": "O teu navegador não permite localização",
  "eventos.geo.showing": "A mostrar {place}",
  "eventos.geo.noneNearby": "Ainda não há eventos perto de ti",
  "eventos.geo.failed": "Não conseguimos obter a tua localização",
  "eventos.geo.errorPrompt": "{msg} · escreve a tua cidade:",
  "eventos.filters.free": "Grátis",
  "eventos.filters.nearMe": "Perto de mim",
  "eventos.filters.more": "Mais filtros",
  "eventos.view.lista": "Lista",
  "eventos.view.calendario": "Calendário",
  "eventos.filters.whenLabel": "Quando",
  "eventos.filters.categoryLabel": "Categoria",
  "eventos.filters.audienceLabel": "Para quem é",
  "eventos.filters.saved": "Guardados",
  "eventos.range.from": "De",
  "eventos.range.to": "até",
  "eventos.count.one": "evento",
  "eventos.count.many": "eventos",
  "eventos.count.in": "em",
  "eventos.count.mockBadge": "exemplos de amostra",
  "eventos.cityauto.placeholder": "Escreve a tua cidade…",
  "eventos.cityauto.empty": "Ainda não temos eventos aí. Experimenta Madrid, Barcelona, Valência…",
  "eventos.band.titleHas": "Tens um novo evento?",
  "eventos.band.titleOrg": "Organizas eventos?",
  "eventos.band.descHas": "Publica-o na agenda e cria o seu flyer em minutos com a tua conta.",
  "eventos.band.descOrg": "Publica o teu evento na agenda e cria o seu flyer em minutos. Grátis para começar.",
  "eventos.band.ctaHas": "Publicar evento",
  "eventos.band.ctaOrg": "Publica o teu evento grátis",
  "eventos.auth.title": "Publica o teu evento",
  "eventos.auth.subtitle": "Cria a tua conta de organizador. É grátis para começar.",
  "eventos.publish.titleHas": "Publica o teu evento",
  "eventos.publish.titleOrg": "Publica o teu evento grátis",
  "eventos.publish.subtitle": "Escolhe a via mais rápida para ti. Envias o flyer e nós lemos a data, o local e o preço.",
  "eventos.publish.close": "Fechar",
  "eventos.publish.web.title": "Aqui mesmo (assistente)",
  "eventos.publish.web.fast": "RÁPIDO",
  "eventos.publish.web.descHas": "Carrega o flyer e preenche-se sozinho. Vais direto ao teu painel.",
  "eventos.publish.web.descOrg": "Carrega o flyer e preenche-se sozinho. Cria a tua conta grátis em segundos.",
  "eventos.publish.telegram.title": "Por Telegram",
  "eventos.publish.telegram.noAccount": "SEM CONTA",
  "eventos.publish.telegram.desc": "Envia o flyer ao bot e ele publica-se sozinho. Os teus eventos esperam por ti se abrires conta depois.",
  "eventos.publish.telegram.soonDesc": "A ativar o bot — disponível muito em breve.",
  "eventos.publish.whatsapp.title": "Por WhatsApp",
  "eventos.publish.whatsapp.desc": "Em breve: o mesmo bot, no teu WhatsApp.",
  "eventos.publish.voice.title": "Por voz",
  "eventos.publish.voice.desc": "Em breve: conta o teu evento com um áudio.",
  "eventos.publish.soonBadge": "EM BREVE",
  "eventos.list.today": "Hoje · ",
  "eventos.list.seeAll": "Ver todos",
  "eventos.card.consult": "Consultar",
  "eventos.card.free": "Grátis",
  "eventos.card.priceFrom": "desde ",
  "eventos.card.removeFav": "Remover dos guardados",
  "eventos.card.addFav": "Guardar evento",
  "eventos.card.cancelled": "Cancelado",
  "eventos.card.tickets": "Bilhetes",
  "eventos.card.seeEvent": "Ver evento",
  "eventos.cal.more": "+{n} mais",
  "eventos.cal.legend": "Legenda",
  "eventos.rsvp.join": "Eu vou",
  "eventos.rsvp.joined": "Confirmado!",
  "eventos.rsvp.count": "{n} vão",
  "eventos.stats.week": "esta semana",
  "eventos.stats.free": "grátis",
  "eventos.stats.attending": "vão",
  "eventos.stats.summary": "Resumo",
  "eventos.featured.title": "Em destaque",
  "eventos.featured.popular": "Popular hoje",
  "eventos.featured.see": "Ver evento",
  "eventos.modal.seeFlyer": "Ver flyer",
  "eventos.modal.priceTbc": "Preço por confirmar",
  "eventos.modal.priceFree": "Entrada gratuita",
  "eventos.modal.timeSuffix": "h",
  "eventos.modal.saved": "Guardado",
  "eventos.modal.save": "Guardar",
  "eventos.modal.copied": "Copiado!",
  "eventos.modal.share": "Partilhar",
  "eventos.modal.buyOnline": "Comprar bilhetes online",
  "eventos.modal.freeEntry": "Entrada livre — não precisas de reservar",
  "eventos.modal.consultOrganizer": "Consulta o preço com o organizador",
  "eventos.modal.boxOffice": "Bilhetes na bilheteira",
  "eventos.lightbox.close": "Fechar",
  "eventos.seal.cancelled": "Cancelado",
  "eventos.empty.title": "Não há eventos com esses filtros",
  "eventos.empty.body": "Tenta mudar a cidade, as datas ou retira algum filtro.",
  "eventos.empty.reset": "Limpar filtros",
  // ── PANEL ORGANIZADOR ──
  "org.cat.fiesta": "Festa",
  "org.cat.conciertos": "Concertos",
  "org.cat.festival": "Festival",
  "org.cat.clases": "Aulas de dança",
  "org.cat.club": "Club / Discoteca",
  "org.cat.corporativo": "Corporativo",
  "org.cat.social": "Bailes sociais",
  "org.cat.teatro": "Teatro",
  "org.aud.academias": "Academias",
  "org.aud.productoras": "Produtoras",
  "org.aud.freelance": "Freelance",
  "org.aud.instituciones": "Instituições",
  "org.aud.agencias": "Agências",
  "org.aud.colegios": "Escolas",
  "org.claim.success": "✅ Reclamaste {n} {events} enviados pelo bot.",
  "org.gate.titleClaim": "Inicia sessão para reclamar os teus eventos",
  "org.gate.titlePublish": "Inicia sessão para publicar eventos",
  "org.gate.bodyClaim": "Os flyers que enviaste pelo bot já estão publicados. Abre a tua conta para os gerir.",
  "org.gate.bodyPublish": "Cria a tua conta de organizador para adicionar eventos à agenda e desenhar os seus flyers.",
  "org.gate.signIn": "Iniciar sessão",
  "org.gate.back": "← Voltar à agenda",
  "org.gate.authClaim": "Reclama os teus eventos",
  "org.gate.authPublish": "Publica o teu evento",
  "org.auth.subtitle": "Cria a tua conta de organizador. É grátis para começar.",
  "org.header.backLink": "← Agenda pública",
  "org.header.titleAdmin": "Todos os eventos",
  "org.header.titleMine": "Os meus eventos",
  "org.header.adminBadge": "Admin",
  "org.header.descAdmin": "Gere qualquer evento (incluindo os do bot sem dono).",
  "org.header.descMine": "Publica eventos na agenda e desenha os seus flyers.",
  "org.header.newEvent": "Novo evento",
  "org.loading": "A carregar os teus eventos…",
  "org.section.drafts": "Rascunhos",
  "org.section.draftsHint": "Só tu os vês. Publica-os para que apareçam na agenda.",
  "org.section.upcoming": "Próximos ({n})",
  "org.section.upcomingHint": "Publicados e ainda por realizar — visíveis na agenda.",
  "org.section.upcomingEmpty": "Não tens eventos próximos. Carrega em “Novo evento” ou envia um flyer ao bot.",
  "org.section.past": "Terminados ({n})",
  "org.section.pastHint": "Já passaram. Não aparecem na agenda pública.",
  "org.section.cancelled": "Cancelados ({n})",
  "org.section.cancelledHint": "Continuam visíveis na agenda com o selo CANCELADO. Podes reativá-los.",
  "org.row.cancelShort": "Cancel.",
  "org.row.consult": "Consultar",
  "org.row.free": "Grátis",
  "org.row.series": "🔁 série · {n} datas",
  "org.row.anon": "anónimo",
  "org.row.unpublish": "Despublicar",
  "org.row.publish": "Publicar",
  "org.row.reactivate": "Reativar evento",
  "org.row.markCancelled": "Marcar como cancelado",
  "org.row.edit": "Editar",
  "org.row.delete": "Eliminar",
  "org.delete.confirm": "Eliminar \"{title}\"? Esta ação não pode ser anulada.",
  "org.form.titleEdit": "Editar evento",
  "org.form.titleNew": "Novo evento",
  "org.form.errRequired": "Preenche pelo menos o título, a data e o local.",
  "org.form.errUpload": "Não foi possível carregar o flyer",
  "org.form.errUploadGeneric": "Erro ao carregar o flyer",
  "org.form.labelTitle": "Título *",
  "org.form.phTitle": "Ex. Concerto de verão",
  "org.form.labelDate": "Data *",
  "org.form.labelTime": "Hora",
  "org.form.labelCity": "Cidade",
  "org.form.labelCategory": "Categoria",
  "org.form.labelAudience": "Para quem é (opcional)",
  "org.form.labelVenue": "Local / sala *",
  "org.form.phVenue": "Ex. Sala La Riviera",
  "org.form.labelNeighborhood": "Bairro / zona",
  "org.form.phNeighborhood": "Ex. Centro",
  "org.form.labelFlyer": "Flyer do evento",
  "org.form.uploading": "A carregar…",
  "org.form.changeFlyer": "Mudar flyer",
  "org.form.uploadFlyer": "Carregar flyer",
  "org.form.noFlyer": "Não tens flyer? Cria-o aqui",
  "org.form.labelPrice": "Preço (€) — vazio = consultar · 0 = grátis",
  "org.form.phPrice": "desde…",
  "org.form.labelPriceInfo": "Tarifas (se houver várias)",
  "org.form.phPriceInfo": "Antecipada 12€ · Bilheteira 15€",
  "org.form.onlineSale": "Venda de bilhetes online?",
  "org.form.phTicketUrl": "https://… página do evento ou pagamento",
  "org.form.labelDescription": "Descrição",
  "org.form.phDescription": "Detalhes do evento…",
  "org.form.saveDraft": "Guardar rascunho",
  "org.form.publish": "Publicar",
  "org.empty.title": "Ainda não tens eventos",
  "org.empty.body": "Cria o teu primeiro evento e publica-o na agenda pública em menos de um minuto.",
  "org.empty.create": "Criar evento",
};

export const TRANSLATIONS: Record<Locale, Dict> = { es, en, fr, pt };
