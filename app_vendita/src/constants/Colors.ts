/**
 * Sistema di Design - Palette Colori
 * Definizione dei colori principali dell'applicazione per garantire coerenza visiva
 */

export const Colors = {
  // Colori primari
  primary: '#007AFF', // Blu vibrante per elementi interattivi
  secondary: '#F2F2F7', // Grigio chiaro per sfondi

  // Colori del testo
  textPrimary: '#1C1C1E', // Nero quasi puro per il testo principale
  textSecondary: '#8A8A8E', // Grigio medio per testo secondario e placeholder
  text: '#1C1C1E', // Alias per textPrimary

  // Colori di sistema
  border: '#E0E0E0', // Grigio chiaro per bordi e separatori
  background: '#FFFFFF', // Bianco per sfondi principali
  surface: '#F8F9FA', // Grigio molto chiaro per superfici
  white: '#FFFFFF', // Alias per background
  black: '#000000', // Nero puro
  gray: '#8A8A8E', // Grigio medio

  // Colori di accento
  accentSuccess: '#34C759', // Verde per conferme
  accentError: '#D93B3B', // Rosso acceso per errori e problemi
  accentWarning: '#FF9500', // Arancione per avvisi
  error: '#D93B3B', // Alias per accentError

  // Colori per tag e categorie
  tagPersonnel: '#A284FF', // Viola per tag persone
  tagAction: '#FF9F0A', // Arancione per tag azioni
  tagSales: '#34C759', // Verde per vendite
  tagProblem: '#D93B3B', // Rosso per problemi

  // Colori per stati
  selected: '#007AFF', // Blu per elementi selezionati
  disabled: '#C7C7CC', // Grigio per elementi disabilitati
  overlay: 'rgba(0, 0, 0, 0.5)', // Overlay scuro per modal

  // Colori per il calendario
  calendarToday: '#007AFF', // Blu per il giorno corrente
  calendarSelected: '#007AFF', // Blu per il giorno selezionato
  calendarOtherMonth: '#C7C7CC', // Grigio per giorni di altri mesi
  calendarWeekend: '#FF3B30', // Rosso per weekend

  // Colori caldi e accoglienti
  warmBackground: '#FEFEFE', // Bianco leggermente caldo
  warmSurface: '#F5F7FA', // Grigio azzurro molto chiaro
  warmBorder: '#E8EDF2', // Bordo più caldo
  warmPrimary: '#4A90E2', // Blu più caldo
  warmSecondary: '#F0F4F8', // Grigio azzurro chiaro
  warmAccent: '#FF6B35', // Arancione caldo
  warmSuccess: '#4CAF50', // Verde più caldo
  warmError: '#F44336', // Rosso più caldo
  warmText: '#2C3E50', // Testo più caldo
  warmTextSecondary: '#7F8C8D', // Testo secondario più caldo
} as const;

export type ColorKey = keyof typeof Colors;
