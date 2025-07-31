import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../lib/src/data/repositories/firestore_calendar_repository.dart';
import '../../lib/src/domain/entities/calendar_entry.dart';
import '../../lib/src/core/errors/app_exception.dart';

// Genera i mock per le dipendenze
@GenerateMocks([FirebaseFirestore, CollectionReference, DocumentReference, Query, QuerySnapshot, DocumentSnapshot])
import 'firestore_calendar_repository_test.mocks.dart';

void main() {
  group('FirestoreCalendarRepository', () {
    late FirestoreCalendarRepository repository;
    late MockFirebaseFirestore mockFirestore;
    late MockCollectionReference mockCollection;
    late MockQuery mockQuery;
    late MockQuerySnapshot mockQuerySnapshot;
    late MockDocumentReference mockDocumentRef;
    late MockDocumentSnapshot mockDocumentSnapshot;

    setUp(() {
      mockFirestore = MockFirebaseFirestore();
      mockCollection = MockCollectionReference();
      mockQuery = MockQuery();
      mockQuerySnapshot = MockQuerySnapshot();
      mockDocumentRef = MockDocumentReference();
      mockDocumentSnapshot = MockDocumentSnapshot();

      repository = FirestoreCalendarRepository(mockFirestore);

      // Setup dei mock di base
      when(mockFirestore.collection('calendar_entries'))
          .thenReturn(mockCollection);
      when(mockCollection.where(any, isEqualTo: anyNamed('isEqualTo')))
          .thenReturn(mockQuery);
      when(mockCollection.doc(any))
          .thenReturn(mockDocumentRef);
      when(mockQuery.orderBy(any, descending: anyNamed('descending')))
          .thenReturn(mockQuery);
      when(mockQuery.limit(any))
          .thenReturn(mockQuery);
      when(mockQuery.get())
          .thenAnswer((_) async => mockQuerySnapshot);
    });

    group('getCalendarEntries', () {
      test('dovrebbe recuperare le voci del calendario per un utente', () async {
        // Arrange
        const userId = 'user123';
        final mockEntries = [
          {
            'id': 'entry1',
            'title': 'Appuntamento 1',
            'description': 'Descrizione 1',
            'startTime': DateTime.now().toIso8601String(),
            'endTime': DateTime.now().add(Duration(hours: 1)).toIso8601String(),
            'userId': userId,
            'salesPointId': 'point1',
            'status': 'scheduled',
            'createdAt': DateTime.now().toIso8601String(),
            'updatedAt': DateTime.now().toIso8601String(),
          },
        ];

        final mockDocs = mockEntries.map((data) {
          final mockDoc = MockDocumentSnapshot();
          when(mockDoc.data()).thenReturn(data);
          when(mockDoc.id).thenReturn(data['id']);
          return mockDoc;
        }).toList();

        when(mockQuerySnapshot.docs).thenReturn(mockDocs);

        // Act
        final result = await repository.getCalendarEntries(userId: userId);

        // Assert
        expect(result, hasLength(1));
        expect(result.first.title, equals('Appuntamento 1'));
        expect(result.first.userId, equals(userId));

        verify(mockCollection.where('userId', isEqualTo: userId)).called(1);
        verify(mockQuery.orderBy('startTime', descending: false)).called(1);
        verify(mockQuery.limit(100)).called(1);
      });

      test('dovrebbe applicare i filtri di data quando forniti', () async {
        // Arrange
        const userId = 'user123';
        final startDate = DateTime.now();
        final endDate = DateTime.now().add(Duration(days: 7));

        when(mockQuery.where(any, isGreaterThanOrEqualTo: anyNamed('isGreaterThanOrEqualTo')))
            .thenReturn(mockQuery);
        when(mockQuery.where(any, isLessThanOrEqualTo: anyNamed('isLessThanOrEqualTo')))
            .thenReturn(mockQuery);
        when(mockQuerySnapshot.docs).thenReturn([]);

        // Act
        await repository.getCalendarEntries(
          userId: userId,
          startDate: startDate,
          endDate: endDate,
        );

        // Assert
        verify(mockQuery.where('startTime', isGreaterThanOrEqualTo: startDate)).called(1);
        verify(mockQuery.where('startTime', isLessThanOrEqualTo: endDate)).called(1);
      });

      test('dovrebbe lanciare DatabaseException in caso di errore Firestore', () async {
        // Arrange
        when(mockQuery.get()).thenThrow(
          FirebaseException(plugin: 'firestore', message: 'Errore di rete'),
        );

        // Act & Assert
        expect(
          () => repository.getCalendarEntries(userId: 'user123'),
          throwsA(isA<DatabaseException>()),
        );
      });
    });

    group('getCalendarEntry', () {
      test('dovrebbe recuperare una voce specifica del calendario', () async {
        // Arrange
        const entryId = 'entry123';
        final mockData = {
          'title': 'Appuntamento Test',
          'description': 'Descrizione Test',
          'startTime': DateTime.now().toIso8601String(),
          'endTime': DateTime.now().add(Duration(hours: 1)).toIso8601String(),
          'userId': 'user123',
          'salesPointId': 'point1',
          'status': 'scheduled',
          'createdAt': DateTime.now().toIso8601String(),
          'updatedAt': DateTime.now().toIso8601String(),
        };

        when(mockDocumentSnapshot.exists).thenReturn(true);
        when(mockDocumentSnapshot.data()).thenReturn(mockData);
        when(mockDocumentSnapshot.id).thenReturn(entryId);
        when(mockDocumentRef.get()).thenAnswer((_) async => mockDocumentSnapshot);

        // Act
        final result = await repository.getCalendarEntry(entryId);

        // Assert
        expect(result, isNotNull);
        expect(result!.title, equals('Appuntamento Test'));
        expect(result.id, equals(entryId));

        verify(mockCollection.doc(entryId)).called(1);
        verify(mockDocumentRef.get()).called(1);
      });

      test('dovrebbe restituire null se la voce non esiste', () async {
        // Arrange
        const entryId = 'nonexistent';
        when(mockDocumentSnapshot.exists).thenReturn(false);
        when(mockDocumentRef.get()).thenAnswer((_) async => mockDocumentSnapshot);

        // Act
        final result = await repository.getCalendarEntry(entryId);

        // Assert
        expect(result, isNull);
      });
    });

    group('createCalendarEntry', () {
      test('dovrebbe creare una nuova voce del calendario', () async {
        // Arrange
        final entry = CalendarEntry(
          id: 'temp_id',
          title: 'Nuovo Appuntamento',
          description: 'Descrizione',
          startTime: DateTime.now(),
          endTime: DateTime.now().add(Duration(hours: 1)),
          userId: 'user123',
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        const newId = 'new_entry_id';
        when(mockCollection.add(any)).thenAnswer((_) async => mockDocumentRef);
        when(mockDocumentRef.id).thenReturn(newId);

        // Act
        final result = await repository.createCalendarEntry(entry);

        // Assert
        expect(result.id, equals(newId));
        expect(result.title, equals('Nuovo Appuntamento'));

        verify(mockCollection.add(any)).called(1);
      });
    });

    group('updateCalendarEntry', () {
      test('dovrebbe aggiornare una voce esistente del calendario', () async {
        // Arrange
        final entry = CalendarEntry(
          id: 'entry123',
          title: 'Appuntamento Aggiornato',
          description: 'Descrizione Aggiornata',
          startTime: DateTime.now(),
          endTime: DateTime.now().add(Duration(hours: 1)),
          userId: 'user123',
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        when(mockDocumentRef.update(any)).thenAnswer((_) async => {});

        // Act
        final result = await repository.updateCalendarEntry(entry);

        // Assert
        expect(result.title, equals('Appuntamento Aggiornato'));
        verify(mockDocumentRef.update(any)).called(1);
      });
    });

    group('deleteCalendarEntry', () {
      test('dovrebbe eliminare una voce del calendario', () async {
        // Arrange
        const entryId = 'entry123';
        when(mockDocumentRef.delete()).thenAnswer((_) async => {});

        // Act
        final result = await repository.deleteCalendarEntry(entryId);

        // Assert
        expect(result, isTrue);
        verify(mockDocumentRef.delete()).called(1);
      });
    });
  });
} 