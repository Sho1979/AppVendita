import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logging/logging.dart';

import '../../domain/repositories/calendar_repository.dart';
import '../../domain/entities/calendar_entry.dart';
import '../../core/errors/app_exception.dart';

/// Implementazione Firestore del repository del calendario.
/// 
/// Fornisce l'implementazione concreta per l'accesso ai dati
/// del calendario tramite Firestore, con gestione degli errori
/// e query ottimizzate.
class FirestoreCalendarRepository implements CalendarRepository {
  /// Crea una nuova istanza del repository Firestore.
  /// 
  /// [firestore] - Istanza di Firestore per l'accesso ai dati
  FirestoreCalendarRepository(this._firestore) {
    _logger = Logger('FirestoreCalendarRepository');
  }

  final FirebaseFirestore _firestore;
  late final Logger _logger;

  /// Collezione Firestore per le voci del calendario.
  static const String _collectionName = 'calendar_entries';

  @override
  Future<List<CalendarEntry>> getCalendarEntries({
    required String userId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      _logger.info('Recupero voci calendario per utente: $userId');

      Query query = _firestore.collection(_collectionName)
          .where('userId', isEqualTo: userId)
          .orderBy('startTime', descending: false);

      // Applica filtri di data se forniti
      if (startDate != null) {
        query = query.where('startTime', isGreaterThanOrEqualTo: startDate);
      }
      if (endDate != null) {
        query = query.where('startTime', isLessThanOrEqualTo: endDate);
      }

      // Limita i risultati per performance
      query = query.limit(100);

      final querySnapshot = await query.get();
      
      final entries = querySnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return CalendarEntry.fromJson({
          'id': doc.id,
          ...data,
        });
      }).toList();

      _logger.info('Recuperate ${entries.length} voci calendario');
      return entries;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile recuperare le voci del calendario: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante il recupero delle voci del calendario',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<CalendarEntry?> getCalendarEntry(String entryId) async {
    try {
      _logger.info('Recupero voce calendario: $entryId');

      final docSnapshot = await _firestore
          .collection(_collectionName)
          .doc(entryId)
          .get();

      if (!docSnapshot.exists) {
        _logger.info('Voce calendario non trovata: $entryId');
        return null;
      }

      final data = docSnapshot.data() as Map<String, dynamic>;
      final entry = CalendarEntry.fromJson({
        'id': docSnapshot.id,
        ...data,
      });

      _logger.info('Voce calendario recuperata: ${entry.title}');
      return entry;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile recuperare la voce del calendario: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante il recupero della voce del calendario',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<CalendarEntry> createCalendarEntry(CalendarEntry entry) async {
    try {
      _logger.info('Creazione nuova voce calendario: ${entry.title}');

      // Rimuovi l'ID per permettere a Firestore di generarlo
      final data = entry.toJson()..remove('id');
      
      final docRef = await _firestore
          .collection(_collectionName)
          .add(data);

      final createdEntry = entry.copyWith(id: docRef.id);
      
      _logger.info('Voce calendario creata con ID: ${docRef.id}');
      return createdEntry;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile creare la voce del calendario: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante la creazione della voce del calendario',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<CalendarEntry> updateCalendarEntry(CalendarEntry entry) async {
    try {
      _logger.info('Aggiornamento voce calendario: ${entry.id}');

      final data = entry.toJson()..remove('id');
      data['updatedAt'] = DateTime.now().toIso8601String();

      await _firestore
          .collection(_collectionName)
          .doc(entry.id)
          .update(data);

      final updatedEntry = entry.copyWith(
        updatedAt: DateTime.now(),
      );

      _logger.info('Voce calendario aggiornata: ${entry.title}');
      return updatedEntry;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile aggiornare la voce del calendario: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante l\'aggiornamento della voce del calendario',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<bool> deleteCalendarEntry(String entryId) async {
    try {
      _logger.info('Eliminazione voce calendario: $entryId');

      await _firestore
          .collection(_collectionName)
          .doc(entryId)
          .delete();

      _logger.info('Voce calendario eliminata: $entryId');
      return true;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile eliminare la voce del calendario: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante l\'eliminazione della voce del calendario',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<List<CalendarEntry>> getCalendarEntriesBySalesPoint({
    required String salesPointId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      _logger.info('Recupero voci calendario per punto vendita: $salesPointId');

      Query query = _firestore.collection(_collectionName)
          .where('salesPointId', isEqualTo: salesPointId)
          .orderBy('startTime', descending: false);

      if (startDate != null) {
        query = query.where('startTime', isGreaterThanOrEqualTo: startDate);
      }
      if (endDate != null) {
        query = query.where('startTime', isLessThanOrEqualTo: endDate);
      }

      query = query.limit(100);

      final querySnapshot = await query.get();
      
      final entries = querySnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return CalendarEntry.fromJson({
          'id': doc.id,
          ...data,
        });
      }).toList();

      _logger.info('Recuperate ${entries.length} voci calendario per punto vendita');
      return entries;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile recuperare le voci del calendario per il punto vendita: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante il recupero delle voci del calendario per il punto vendita',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<List<CalendarEntry>> getCalendarEntriesByDateRange({
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  }) async {
    try {
      _logger.info('Recupero voci calendario per periodo: $startDate - $endDate');

      Query query = _firestore.collection(_collectionName)
          .where('startTime', isGreaterThanOrEqualTo: startDate)
          .where('startTime', isLessThanOrEqualTo: endDate)
          .orderBy('startTime', descending: false);

      if (userId != null) {
        query = query.where('userId', isEqualTo: userId);
      }

      query = query.limit(100);

      final querySnapshot = await query.get();
      
      final entries = querySnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return CalendarEntry.fromJson({
          'id': doc.id,
          ...data,
        });
      }).toList();

      _logger.info('Recuperate ${entries.length} voci calendario per periodo');
      return entries;
    } on FirebaseException catch (e) {
      _logger.severe('Errore Firestore: ${e.message}', e);
      throw DatabaseException(
        'Impossibile recuperare le voci del calendario per il periodo: ${e.message}',
        e.code,
      );
    } catch (e) {
      _logger.severe('Errore generico: $e', e);
      throw DatabaseException(
        'Errore imprevisto durante il recupero delle voci del calendario per il periodo',
        'UNKNOWN_ERROR',
      );
    }
  }
} 