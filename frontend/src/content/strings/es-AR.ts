/**
 * Tinkú — Strings es-AR (rioplatense).
 * Fuente única de texto visible al usuario. Facilita i18n futura sin refactor.
 * "vos" no "tú", "querés" no "quieres", celebraciones cálidas.
 */

export const strings = {
  common: {
    appName: 'Tinkú',
    tagline: 'Las Islas del Saber',
    loading: 'Cargando…',
    error: '¡Uy! Algo no salió bien. Probá de nuevo en un ratito.',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    save: 'Guardar',
    back: 'Volver',
  },

  marketing: {
    heroTitle: 'Aprender jugando, de verdad.',
    heroSub: 'Tinkú acompaña a tus hijos a descubrir matemática y lengua en un mundo de islas, con contenido del currículo argentino y datos reales para vos.',
    ctaSignup: 'Crear cuenta gratis',
    ctaLogin: 'Ya tengo cuenta',
  },

  auth: {
    signup: {
      title: 'Creá tu cuenta de padre/madre',
      subtitle: 'Necesitamos tus datos para configurar la cuenta. Los datos de tu hijo/a los vamos a pedir después, con tu consentimiento explícito.',
      fullNameLabel: 'Tu nombre y apellido',
      fullNamePlaceholder: 'Ej: Laura Martínez',
      emailLabel: 'Tu email',
      emailPlaceholder: 'laura@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordHelp: 'Mínimo 8 caracteres, al menos una letra y un número.',
      passwordPlaceholder: '••••••••',
      submit: 'Crear cuenta',
      submitting: 'Creando tu cuenta…',
      loginHint: '¿Ya tenés cuenta?',
      loginLink: 'Entrar',
      termsHint: 'Al crear tu cuenta aceptás los términos de uso y la política de privacidad.',
      errors: {
        emailTaken: 'Este email ya tiene una cuenta. ¿Querés entrar?',
        weakPassword: 'La contraseña es muy corta. Necesita mínimo 8 caracteres con letras y números.',
        invalidEmail: 'Ese email no parece válido.',
        generic: 'No pudimos crear la cuenta. Probá de nuevo en un momento.',
      },
    },
    login: {
      title: 'Entrar a Tinkú',
      subtitle: 'Accedé con tu email y contraseña.',
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      submit: 'Entrar',
      submitting: 'Entrando…',
      signupHint: '¿Todavía no tenés cuenta?',
      signupLink: 'Crear cuenta',
      errors: {
        invalidCredentials: 'El email o la contraseña no coinciden.',
        rateLimited: 'Muchos intentos fallidos. Esperá unos minutos.',
        generic: 'No pudimos entrar. Probá de nuevo en un momento.',
      },
    },
    verify: {
      sentTitle: 'Revisá tu email',
      sentBody: 'Te mandamos un link a {email} para confirmar tu cuenta. Hacé click ahí y volvemos.',
      resend: 'Reenviar email',
      resending: 'Enviando…',
      resent: 'Listo, volvemos a mandarlo.',
      successTitle: '¡Email confirmado!',
      successBody: 'Ya podés empezar a usar Tinkú.',
      successCta: 'Ir al panel',
      invalidTitle: 'Link inválido o vencido',
      invalidBody: 'Este link ya se usó o se venció. Pedí uno nuevo desde tu panel.',
      invalidCta: 'Pedir nuevo link',
    },
  },

  parent: {
    dashboard: {
      title: 'Tu panel',
      welcome: '¡Hola, {name}!',
      verifyBanner: 'Te falta confirmar tu email. Revisá tu bandeja de entrada.',
      verifyBannerAction: 'Reenviar',
      noStudents: 'Todavía no agregaste hijos/as.',
      noStudentsCta: 'Agregar un hijo/a',
      plan: {
        free: 'Plan gratuito',
        premiumActive: 'Plan Premium',
      },
    },
  },
} as const;

export type Strings = typeof strings;
