import 'package:flutter/material.dart';
import 'package:logging/logging.dart';

import '../../domain/entities/calendar_entry.dart';
import '../../domain/repositories/calendar_repository.dart';
import '../../core/errors/app_exception.dart';

/// Stato per la gestione delle voci del calendario.
/// 
/// Gestisce gli stati di loading, data e error per le operazioni
/// del calendario.
class CalendarState {
  /// Crea un nuovo stato del calendario.
  /// 
  /// [entries] - Lista delle voci del calendario
  /// [isLoading] - Se è in corso un caricamento
  /// [error] - Messaggio di errore se presente
  const CalendarState({
    this.entries = const [],
    this.isLoading = false,
    this.error,
  });

  /// Lista delle voci del calendario.
  final List<CalendarEntry> entries;

  /// Se è in corso un caricamento.
  final bool isLoading;

  /// Messaggio di errore se presente.
  final String? error;

  /// Crea una copia di questo stato con i valori aggiornati.
  CalendarState copyWith({
    List<CalendarEntry>? entries,
    bool? isLoading,
    String? error,
  }) {
    return CalendarState(
      entries: entries ?? this.entries,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  /// Crea uno stato di loading.
  CalendarState loading() {
    return copyWith(isLoading: true, error: null);
  }

  /// Crea uno stato con dati.
  CalendarState data(List<CalendarEntry> entries) {
    return copyWith(entries: entries, isLoading: false, error: null);
  }

  /// Crea uno stato di errore.
  CalendarState error(String message) {
    return copyWith(isLoading: false, error: message);
  }
}

/// Provider per lo stato del calendario.
/// 
/// Gestisce lo stato delle voci del calendario per un utente specifico,
/// includendo loading, data e stati di errore.
class CalendarNotifier extends ChangeNotifier {
  CalendarNotifier() {
    _logger = Logger('CalendarNotifier');
  }

  late final Logger _logger;
  CalendarState _state = const CalendarState();

  /// Stato corrente del calendario.
  CalendarState get state => _state;

  /// Carica le voci del calendario per un utente.
  /// 
  /// [userId] - ID dell'utente per cui caricare le voci
  /// [startDate] - Data di inizio per il filtro (opzionale)
  /// [endDate] - Data di fine per il filtro (opzionale)
  Future<void> loadCalendarEntries({
    required String userId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      _logger.info('Caricamento voci calendario per utente: $userId');
      
      _state = _state.loading();
      notifyListeners();

      // Per ora, creiamo alcuni dati di esempio
      await Future.delayed(Duration(seconds: 1)); // Simula una chiamata di rete
      
      final entries = [
        CalendarEntry(
          id: '1',
          title: 'Appuntamento con Cliente A',
          description: 'Presentazione prodotti e discussione offerte',
          startTime: DateTime.now().add(Duration(hours: 2)),
          endTime: DateTime.now().add(Duration(hours: 3)),
          userId: userId,
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        CalendarEntry(
          id: '2',
          title: 'Riunione Team Vendite',
          description: 'Discussione obiettivi settimanali',
          startTime: DateTime.now().add(Duration(days: 1, hours: 10)),
          endTime: DateTime.now().add(Duration(days: 1, hours: 11)),
          userId: userId,
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      _state = _state.data(entries);
      _logger.info('Caricate ${entries.length} voci calendario');
      notifyListeners();
    } catch (e) {
      _logger.severe('Errore imprevisto: $e', e);
      _state = _state.error('Errore imprevisto durante il caricamento delle voci del calendario');
      notifyListeners();
    }
  }

  /// Crea una nuova voce del calendario.
  /// 
  /// [entry] - La voce del calendario da creare
  Future<void> createCalendarEntry(CalendarEntry entry) async {
    try {
      _logger.info('Creazione nuova voce calendario: ${entry.title}');
      
      _state = _state.loading();
      notifyListeners();

      // Simula la creazione
      await Future.delayed(Duration(milliseconds: 500));
      
      final createdEntry = entry.copyWith(id: DateTime.now().millisecondsSinceEpoch.toString());
      final updatedEntries = [..._state.entries, createdEntry];
      _state = _state.data(updatedEntries);
      
      _logger.info('Voce calendario creata con successo');
      notifyListeners();
    } catch (e) {
      _logger.severe('Errore imprevisto: $e', e);
      _state = _state.error('Errore imprevisto durante la creazione della voce del calendario');
      notifyListeners();
    }
  }

  /// Elimina una voce del calendario.
  /// 
  /// [entryId] - ID della voce da eliminare
  Future<void> deleteCalendarEntry(String entryId) async {
    try {
      _logger.info('Eliminazione voce calendario: $entryId');
      
      _state = _state.loading();
      notifyListeners();

      // Simula l'eliminazione
      await Future.delayed(Duration(milliseconds: 500));
      
      final updatedEntries = _state.entries.where((e) => e.id != entryId).toList();
      _state = _state.data(updatedEntries);
      
      _logger.info('Voce calendario eliminata con successo');
      notifyListeners();
    } catch (e) {
      _logger.severe('Errore imprevisto: $e', e);
      _state = _state.error('Errore imprevisto durante l\'eliminazione della voce del calendario');
      notifyListeners();
    }
  }

  /// Pulisce lo stato di errore.
  void clearError() {
    _state = _state.copyWith(error: null);
    notifyListeners();
  }
} 