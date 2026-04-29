// Real Unsplash photos of safety professionals, training, study materials.
// Drop-in replacements — no AI generated images. URLs are CDN-stable query strings.

export const IMAGES = {
  HERO_BG:           'https://images.unsplash.com/photo-1621905252472-943afaa20e20?auto=format&fit=crop&w=1920&q=80',
  HERO_BG_ALT:       'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1920&q=80',

  // Certification cover photos
  CERT_CSP:          'https://images.unsplash.com/photo-1662309376159-b95fb193d96b?auto=format&fit=crop&w=800&q=80',
  CERT_ASP:          'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=800&q=80',
  CERT_OHST:         'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
  CERT_CHST:         'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80',
  CERT_CIH:          'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
  CERT_SMS:          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  CERT_STS:          'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=800&q=80',

  // Testimonial profile photos
  PERSON_1:          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  PERSON_2:          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
  PERSON_3:          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
  PERSON_4:          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  PERSON_5:          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80',
  PERSON_6:          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
} as const;

export type ImageKey = keyof typeof IMAGES;
