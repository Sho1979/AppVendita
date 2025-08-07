/**
 * Sistema di Design - Spaziatura
 * Definizione delle unità di spaziatura per garantire coerenza visiva
 */

export const Spacing = {
  // Unità di base: 8px
  xs: 4, // 4px
  small: 8, // 8px - unità di base
  medium: 16, // 16px
  large: 24, // 24px
  xl: 32, // 32px
  xlarge: 32, // 32px - alias per xl
  xxl: 48, // 48px

  // Spaziatura specifica per componenti
  buttonPadding: 12, // Padding per pulsanti
  cardPadding: 16, // Padding per card
  sectionPadding: 24, // Padding per sezioni
  screenPadding: 16, // Padding per schermate

  // Margini
  margin: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xl: 32,
  },

  // Padding
  padding: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xl: 32,
  },

  // Gap per layout
  gap: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xl: 32,
  },
} as const;

export type SpacingKey = keyof typeof Spacing;
