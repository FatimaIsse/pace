// Core-UI translations. Scope is deliberate: navigation, the Today page,
// the daily check-in, task actions, and Need help? — the parts of Pace
// someone sees every single day. Everything else (Calendar, Habits detail,
// Projects, Questions, all the deeper sheets) stays in English for now and
// can be extended into this same dictionary later without touching the
// lookup mechanism.

export type Language = 'en' | 'ar' | 'es' | 'fr'

export const LANGUAGES: Language[] = ['en', 'ar', 'es', 'fr']

export const LANGUAGE_LABEL: Record<Language, string> = {
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
}

export const RTL_LANGUAGES: Language[] = ['ar']

export type TranslationKey = keyof typeof translations.en

const translations = {
  en: {
    'nav.today': 'Today',
    'nav.plan': 'Plan',
    'nav.calendar': 'Calendar',
    'nav.habits': 'Habits',
    'nav.projects': 'Projects',
    'nav.notes': 'Notes',
    'nav.me': 'Me',
    'nav.add': 'Add',

    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',

    'today.rightNow': 'Right now',
    'today.later': 'Later',
    'today.changeTop3': 'Change my Top 3',
    'today.daily': 'Daily',
    'today.completedToday': 'Completed today',
    'today.needHelp': 'Need help?',
    'today.seeEverything': 'See everything',
    'today.emptyTitle': 'Nothing urgent right now.',
    'today.emptySubtitle': 'Enjoy the space.',
    'today.todaysWin': "Today's win:",

    'task.start': 'Start',
    'task.done': 'Done',
    'task.whyThisNow': 'Why this now?',
    'task.skip': 'Skip',
    'task.edit': 'Edit',
    'task.move': 'Move',
    'task.moveToTomorrow': 'Move to tomorrow',
    'task.delete': 'Delete',

    'checkin.energyQuestion': "How's your energy?",
    'checkin.energyLow': 'Low',
    'checkin.energyOkay': 'Okay',
    'checkin.energyGood': 'Good',
    'checkin.loadQuestion': 'What kind of day is this?',
    'checkin.loadLight': 'Light',
    'checkin.loadNormal': 'Normal',
    'checkin.loadPacked': 'Packed',
    'checkin.successQuestion': 'What would make today feel successful? (optional)',
    'checkin.successPlaceholder': 'One thing — the rest is a bonus.',
    'checkin.continue': 'Continue',

    'needHelp.title': 'What do you need?',
    'needHelp.startHere': "I don't know where to start",
    'needHelp.plansChanged': 'My plans changed',
    'needHelp.overwhelmed': "I'm overwhelmed",
    'needHelp.minimumDay': 'I need a minimum day',
    'needHelp.break': 'I need a break',

    'prefs.language': 'Language',
    'prefs.languageHint': 'Choose the language Pace displays in.',
  },

  ar: {
    'nav.today': 'اليوم',
    'nav.plan': 'الخطة',
    'nav.calendar': 'التقويم',
    'nav.habits': 'العادات',
    'nav.projects': 'المشاريع',
    'nav.notes': 'الملاحظات',
    'nav.me': 'حسابي',
    'nav.add': 'إضافة',

    'greeting.morning': 'صباح الخير',
    'greeting.afternoon': 'طاب نهارك',
    'greeting.evening': 'مساء الخير',

    'today.rightNow': 'الآن',
    'today.later': 'لاحقًا',
    'today.changeTop3': 'تغيير أولوياتي الثلاث',
    'today.daily': 'يومي',
    'today.completedToday': 'المكتمل اليوم',
    'today.needHelp': 'تحتاج مساعدة؟',
    'today.seeEverything': 'عرض الكل',
    'today.emptyTitle': 'لا شيء عاجل الآن.',
    'today.emptySubtitle': 'استمتع بوقتك.',
    'today.todaysWin': 'إنجاز اليوم:',

    'task.start': 'ابدأ',
    'task.done': 'تم',
    'task.whyThisNow': 'لماذا الآن؟',
    'task.skip': 'تخطي',
    'task.edit': 'تعديل',
    'task.move': 'نقل',
    'task.moveToTomorrow': 'نقل إلى الغد',
    'task.delete': 'حذف',

    'checkin.energyQuestion': 'كيف طاقتك؟',
    'checkin.energyLow': 'منخفضة',
    'checkin.energyOkay': 'متوسطة',
    'checkin.energyGood': 'جيدة',
    'checkin.loadQuestion': 'كيف يبدو يومك؟',
    'checkin.loadLight': 'خفيف',
    'checkin.loadNormal': 'عادي',
    'checkin.loadPacked': 'مزدحم',
    'checkin.successQuestion': 'ما الذي يجعل اليوم ناجحًا؟ (اختياري)',
    'checkin.successPlaceholder': 'شيء واحد فقط — والباقي إضافة.',
    'checkin.continue': 'متابعة',

    'needHelp.title': 'ما الذي تحتاجه؟',
    'needHelp.startHere': 'لا أعرف من أين أبدأ',
    'needHelp.plansChanged': 'تغيّرت خططي',
    'needHelp.overwhelmed': 'أشعر بالإرهاق',
    'needHelp.minimumDay': 'أحتاج يومًا بأقل قدر ممكن',
    'needHelp.break': 'أحتاج إلى استراحة',

    'prefs.language': 'اللغة',
    'prefs.languageHint': 'اختر اللغة التي تظهر بها Pace.',
  },

  es: {
    'nav.today': 'Hoy',
    'nav.plan': 'Plan',
    'nav.calendar': 'Calendario',
    'nav.habits': 'Hábitos',
    'nav.projects': 'Proyectos',
    'nav.notes': 'Notas',
    'nav.me': 'Yo',
    'nav.add': 'Añadir',

    'greeting.morning': 'Buenos días',
    'greeting.afternoon': 'Buenas tardes',
    'greeting.evening': 'Buenas noches',

    'today.rightNow': 'Ahora mismo',
    'today.later': 'Más tarde',
    'today.changeTop3': 'Cambiar mis 3 prioridades',
    'today.daily': 'Diario',
    'today.completedToday': 'Completado hoy',
    'today.needHelp': '¿Necesitas ayuda?',
    'today.seeEverything': 'Ver todo',
    'today.emptyTitle': 'Nada urgente por ahora.',
    'today.emptySubtitle': 'Disfruta del espacio.',
    'today.todaysWin': 'El logro de hoy:',

    'task.start': 'Empezar',
    'task.done': 'Hecho',
    'task.whyThisNow': '¿Por qué ahora?',
    'task.skip': 'Omitir',
    'task.edit': 'Editar',
    'task.move': 'Mover',
    'task.moveToTomorrow': 'Mover a mañana',
    'task.delete': 'Eliminar',

    'checkin.energyQuestion': '¿Cómo está tu energía?',
    'checkin.energyLow': 'Baja',
    'checkin.energyOkay': 'Normal',
    'checkin.energyGood': 'Buena',
    'checkin.loadQuestion': '¿Qué tipo de día es hoy?',
    'checkin.loadLight': 'Ligero',
    'checkin.loadNormal': 'Normal',
    'checkin.loadPacked': 'Muy ocupado',
    'checkin.successQuestion': '¿Qué haría que hoy se sintiera exitoso? (opcional)',
    'checkin.successPlaceholder': 'Una sola cosa — el resto es un extra.',
    'checkin.continue': 'Continuar',

    'needHelp.title': '¿Qué necesitas?',
    'needHelp.startHere': 'No sé por dónde empezar',
    'needHelp.plansChanged': 'Mis planes cambiaron',
    'needHelp.overwhelmed': 'Todo es demasiado',
    'needHelp.minimumDay': 'Necesito un día mínimo',
    'needHelp.break': 'Necesito un descanso',

    'prefs.language': 'Idioma',
    'prefs.languageHint': 'Elige el idioma en el que se muestra Pace.',
  },

  fr: {
    'nav.today': "Aujourd'hui",
    'nav.plan': 'Plan',
    'nav.calendar': 'Calendrier',
    'nav.habits': 'Habitudes',
    'nav.projects': 'Projets',
    'nav.notes': 'Notes',
    'nav.me': 'Moi',
    'nav.add': 'Ajouter',

    'greeting.morning': 'Bonjour',
    'greeting.afternoon': 'Bon après-midi',
    'greeting.evening': 'Bonsoir',

    'today.rightNow': 'En ce moment',
    'today.later': 'Plus tard',
    'today.changeTop3': 'Changer mon top 3',
    'today.daily': 'Quotidien',
    'today.completedToday': "Terminé aujourd'hui",
    'today.needHelp': "Besoin d'aide ?",
    'today.seeEverything': 'Tout voir',
    'today.emptyTitle': "Rien d'urgent pour le moment.",
    'today.emptySubtitle': 'Profitez de cet espace.',
    'today.todaysWin': 'La réussite du jour :',

    'task.start': 'Commencer',
    'task.done': 'Terminé',
    'task.whyThisNow': 'Pourquoi maintenant ?',
    'task.skip': 'Passer',
    'task.edit': 'Modifier',
    'task.move': 'Déplacer',
    'task.moveToTomorrow': 'Déplacer à demain',
    'task.delete': 'Supprimer',

    'checkin.energyQuestion': 'Comment est votre énergie ?',
    'checkin.energyLow': 'Faible',
    'checkin.energyOkay': 'Correcte',
    'checkin.energyGood': 'Bonne',
    'checkin.loadQuestion': 'Quel genre de journée est-ce ?',
    'checkin.loadLight': 'Légère',
    'checkin.loadNormal': 'Normale',
    'checkin.loadPacked': 'Chargée',
    'checkin.successQuestion': "Qu'est-ce qui rendrait cette journée réussie ? (facultatif)",
    'checkin.successPlaceholder': 'Une seule chose — le reste est un bonus.',
    'checkin.continue': 'Continuer',

    'needHelp.title': 'De quoi avez-vous besoin ?',
    'needHelp.startHere': 'Je ne sais pas par où commencer',
    'needHelp.plansChanged': 'Mes plans ont changé',
    'needHelp.overwhelmed': 'Je me sens dépassé(e)',
    'needHelp.minimumDay': "J'ai besoin d'une journée minimale",
    'needHelp.break': "J'ai besoin d'une pause",

    'prefs.language': 'Langue',
    'prefs.languageHint': "Choisissez la langue d'affichage de Pace.",
  },
} satisfies Record<Language, Record<string, string>>

export default translations
