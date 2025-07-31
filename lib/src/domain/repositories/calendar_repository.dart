import '../entities/calendar_entry.dart';
import '../../core/errors/app_exception.dart';

/// Interfaccia per il repository del calendario.
/// 
/// Definisce il contratto per l'accesso ai dati del calendario,
/// garantendo la separazione delle preoccupazioni e la testabilità.
abstract class CalendarRepository {
  /// Recupera tutte le voci del calendario per un utente specifico.
  /// 
  /// [userId] - ID dell'utente per cui recuperare le voci
  /// [startDate] - Data di inizio per il filtro (opzionale)
  /// [endDate] - Data di fine per il filtro (opzionale)
  /// 
  /// Restituisce una lista di voci del calendario o lancia un'eccezione
  /// in caso di errore.
  Future<List<CalendarEntry>> getCalendarEntries({
    required String userId,
    DateTime? startDate,
    DateTime? endDate,
  });

  /// Recupera una voce specifica del calendario.
  /// 
  /// [entryId] - ID della voce da recuperare
  /// 
  /// Restituisce la voce del calendario o null se non trovata.
  Future<CalendarEntry?> getCalendarEntry(String entryId);

  /// Crea una nuova voce del calendario.
  /// 
  /// [entry] - La voce del calendario da creare
  /// 
  /// Restituisce la voce creata con l'ID assegnato.
  Future<CalendarEntry> createCalendarEntry(CalendarEntry entry);

  /// Aggiorna una voce esistente del calendario.
  /// 
  /// [entry] - La voce del calendario da aggiornare
  /// 
  /// Restituisce la voce aggiornata.
  Future<CalendarEntry> updateCalendarEntry(CalendarEntry entry);

  /// Elimina una voce del calendario.
  /// 
  /// [entryId] - ID della voce da eliminare
  /// 
  /// Restituisce true se l'eliminazione è avvenuta con successo.
  Future<bool> deleteCalendarEntry(String entryId);

  /// Recupera le voci del calendario per un punto vendita specifico.
  /// 
  /// [salesPointId] - ID del punto vendita
  /// [startDate] - Data di inizio per il filtro (opzionale)
  /// [endDate] - Data di fine per il filtro (opzionale)
  /// 
  /// Restituisce una lista di voci del calendario per il punto vendita.
  Future<List<CalendarEntry>> getCalendarEntriesBySalesPoint({
    required String salesPointId,
    DateTime? startDate,
    DateTime? endDate,
  });

  /// Recupera le voci del calendario per un periodo specifico.
  /// 
  /// [startDate] - Data di inizio del periodo
  /// [endDate] - Data di fine del periodo
  /// [userId] - ID dell'utente (opzionale, se null recupera per tutti)
  /// 
  /// Restituisce una lista di voci del calendario per il periodo.
  Future<List<CalendarEntry>> getCalendarEntriesByDateRange({
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  });
} 