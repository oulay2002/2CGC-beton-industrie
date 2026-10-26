// src/lib/rate-limit.ts — Limitation de débit par adresse IP.
//
// PORTÉE RÉELLE, À NE PAS SURESTIMER
// Le compteur vit dans la mémoire de l'instance. Sur Vercel, plusieurs
// instances servent le trafic en parallèle et sont recyclées : un attaquant
// réparti sur N instances obtient N fois le quota, et un redémarrage remet les
// compteurs à zéro. Ce module est donc une première barrière contre les abus
// accidentels et les scripts naïfs — pas une garantie.
//
// Les protections sur lesquelles on peut réellement compter :
//   - force brute sur la connexion : verrouillage de compte en base
//     (failed_login_count / locked_until), partagé entre toutes les instances,
//     cf. src/app/api/auth/login/route.ts ;
//   - abus volumétrique : règles de limitation du pare-feu Vercel, appliquées
//     en amont des fonctions, cf. docs/PARE_FEU.md.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Stockage en mémoire des requêtes par IP
const ipCache = new Map<string, RateLimitRecord>();

// Nettoyage automatique des clés expirées toutes les 5 minutes pour éviter toute fuite mémoire
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipCache.entries()) {
      if (record.resetAt <= now) {
        ipCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;       // Nombre maximum de requêtes autorisées
  windowMs: number;    // Fenêtre de temps en millisecondes (ex: 60 000 ms = 1 min)
}

/**
 * Vérifie si l'IP dépasse le quota autorisé
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = ipCache.get(identifier);

  if (!record || record.resetAt <= now) {
    ipCache.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      reset: now + options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: options.limit - record.count,
    reset: record.resetAt,
  };
}

/**
 * Extrait l'IP du client depuis les en-têtes de la requête
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}
