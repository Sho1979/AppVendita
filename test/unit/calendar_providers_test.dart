import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import '../../lib/src/presentation/providers/calendar_providers.dart';
import '../../lib/src/domain/entities/calendar_entry.dart';
import '../../lib/src/domain/repositories/calendar_repository.dart';
import '../../lib/src/core/errors/app_exception.dart';

// Genera i mock per le dipendenze
@GenerateMocks([CalendarRepository])
import 'calendar_providers_test.mocks.dart';

void main() {
  group('CalendarProviders', () {
    late ProviderContainer container;
    late MockCalendarRepository mockRepository;

    setUp(() {
      mockRepository = MockCalendarRepository();
      container = ProviderContainer(
        overrides: [
          calendarRepositoryProvider.overrideWithValue(mockRepository),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    group('CalendarNotifier', () {
      test('dovrebbe iniziare con stato iniziale', () {
        final notifier = container.read(calendarNotifierProvider.notifier);
        final state = container.read(calendarNotifierProvider);

        expect(state.entries, isEmpty);
        expect(state.isLoading, isFalse);
        expect(state.error, isNull);
      });

      test('dovrebbe caricare le voci del calendario con successo', () async {
        // Arrange
        const userId = 'user123';
        final mockEntries = [
          CalendarEntry(
            id: 'entry1',
            title: 'Appuntamento 1',
            description: 'Descrizione 1',
            startTime: DateTime.now(),
            endTime: DateTime.now().add(Duration(hours: 1)),
            userId: userId,
            salesPointId: 'point1',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];

        when(mockRepository.getCalendarEntries(
          userId: userId,
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenAnswer((_) async => mockEntries);

        // Act
        await container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: userId,
        );

        // Assert
        final state = container.read(calendarNotifierProvider);
        expect(state.entries, hasLength(1));
        expect(state.entries.first.title, equals('Appuntamento 1'));
        expect(state.isLoading, isFalse);
        expect(state.error, isNull);

        verify(mockRepository.getCalendarEntries(
          userId: userId,
          startDate: null,
          endDate: null,
        )).called(1);
      });

      test('dovrebbe gestire gli errori durante il caricamento', () async {
        // Arrange
        const userId = 'user123';
        const errorMessage = 'Errore di rete';

        when(mockRepository.getCalendarEntries(
          userId: userId,
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenThrow(DatabaseException(errorMessage, 'NETWORK_ERROR'));

        // Act
        await container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: userId,
        );

        // Assert
        final state = container.read(calendarNotifierProvider);
        expect(state.entries, isEmpty);
        expect(state.isLoading, isFalse);
        expect(state.error, equals(errorMessage));
      });

      test('dovrebbe creare una nuova voce del calendario', () async {
        // Arrange
        final newEntry = CalendarEntry(
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

        final createdEntry = newEntry.copyWith(id: 'new_id');

        when(mockRepository.createCalendarEntry(newEntry))
            .thenAnswer((_) async => createdEntry);

        // Act
        await container.read(calendarNotifierProvider.notifier).createCalendarEntry(newEntry);

        // Assert
        final state = container.read(calendarNotifierProvider);
        expect(state.entries, hasLength(1));
        expect(state.entries.first.id, equals('new_id'));
        expect(state.entries.first.title, equals('Nuovo Appuntamento'));

        verify(mockRepository.createCalendarEntry(newEntry)).called(1);
      });

      test('dovrebbe aggiornare una voce esistente del calendario', () async {
        // Arrange
        final existingEntry = CalendarEntry(
          id: 'entry1',
          title: 'Appuntamento Originale',
          description: 'Descrizione',
          startTime: DateTime.now(),
          endTime: DateTime.now().add(Duration(hours: 1)),
          userId: 'user123',
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updatedEntry = existingEntry.copyWith(title: 'Appuntamento Aggiornato');

        // Aggiungi una voce esistente allo stato
        await container.read(calendarNotifierProvider.notifier).createCalendarEntry(existingEntry);

        when(mockRepository.updateCalendarEntry(updatedEntry))
            .thenAnswer((_) async => updatedEntry);

        // Act
        await container.read(calendarNotifierProvider.notifier).updateCalendarEntry(updatedEntry);

        // Assert
        final state = container.read(calendarNotifierProvider);
        expect(state.entries, hasLength(1));
        expect(state.entries.first.title, equals('Appuntamento Aggiornato'));

        verify(mockRepository.updateCalendarEntry(updatedEntry)).called(1);
      });

      test('dovrebbe eliminare una voce del calendario', () async {
        // Arrange
        final entry = CalendarEntry(
          id: 'entry1',
          title: 'Appuntamento da Eliminare',
          description: 'Descrizione',
          startTime: DateTime.now(),
          endTime: DateTime.now().add(Duration(hours: 1)),
          userId: 'user123',
          salesPointId: 'point1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        // Aggiungi una voce allo stato
        await container.read(calendarNotifierProvider.notifier).createCalendarEntry(entry);

        when(mockRepository.deleteCalendarEntry('entry1'))
            .thenAnswer((_) async => true);

        // Act
        await container.read(calendarNotifierProvider.notifier).deleteCalendarEntry('entry1');

        // Assert
        final state = container.read(calendarNotifierProvider);
        expect(state.entries, isEmpty);

        verify(mockRepository.deleteCalendarEntry('entry1')).called(1);
      });

      test('dovrebbe pulire lo stato di errore', () async {
        // Arrange
        const userId = 'user123';
        when(mockRepository.getCalendarEntries(
          userId: userId,
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenThrow(DatabaseException('Errore di test', 'TEST_ERROR'));

        // Crea un errore
        await container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: userId,
        );

        // Verifica che ci sia un errore
        var state = container.read(calendarNotifierProvider);
        expect(state.error, isNotNull);

        // Act
        container.read(calendarNotifierProvider.notifier).clearError();

        // Assert
        state = container.read(calendarNotifierProvider);
        expect(state.error, isNull);
      });
    });

    group('CalendarEntriesByDateRange', () {
      test('dovrebbe filtrare le voci per data', () async {
        // Arrange
        final today = DateTime.now();
        final startOfDay = DateTime(today.year, today.month, today.day);
        final endOfDay = startOfDay.add(Duration(days: 1)).subtract(Duration(seconds: 1));

        final entries = [
          CalendarEntry(
            id: 'entry1',
            title: 'Appuntamento Oggi',
            description: 'Descrizione',
            startTime: startOfDay.add(Duration(hours: 10)),
            endTime: startOfDay.add(Duration(hours: 11)),
            userId: 'user123',
            salesPointId: 'point1',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          CalendarEntry(
            id: 'entry2',
            title: 'Appuntamento Domani',
            description: 'Descrizione',
            startTime: startOfDay.add(Duration(days: 1, hours: 10)),
            endTime: startOfDay.add(Duration(days: 1, hours: 11)),
            userId: 'user123',
            salesPointId: 'point1',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];

        when(mockRepository.getCalendarEntries(
          userId: anyNamed('userId'),
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenAnswer((_) async => entries);

        // Carica le voci
        await container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: 'user123',
        );

        // Act
        final filteredEntries = container.read(
          calendarEntriesByDateRangeProvider(startOfDay, endOfDay),
        );

        // Assert
        expect(filteredEntries, hasLength(1));
        expect(filteredEntries.first.title, equals('Appuntamento Oggi'));
      });

      test('dovrebbe restituire lista vuota se in loading', () async {
        // Arrange
        const userId = 'user123';
        when(mockRepository.getCalendarEntries(
          userId: userId,
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenAnswer((_) async {
          await Future.delayed(Duration(milliseconds: 100));
          return [];
        });

        // Avvia il caricamento (non aspettare che finisca)
        container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: userId,
        );

        final today = DateTime.now();
        final startOfDay = DateTime(today.year, today.month, today.day);
        final endOfDay = startOfDay.add(Duration(days: 1)).subtract(Duration(seconds: 1));

        // Act
        final filteredEntries = container.read(
          calendarEntriesByDateRangeProvider(startOfDay, endOfDay),
        );

        // Assert
        expect(filteredEntries, isEmpty);
      });
    });

    group('TodayCalendarEntries', () {
      test('dovrebbe restituire le voci di oggi', () async {
        // Arrange
        final today = DateTime.now();
        final startOfDay = DateTime(today.year, today.month, today.day);
        final endOfDay = startOfDay.add(Duration(days: 1)).subtract(Duration(seconds: 1));

        final entries = [
          CalendarEntry(
            id: 'entry1',
            title: 'Appuntamento Oggi',
            description: 'Descrizione',
            startTime: startOfDay.add(Duration(hours: 10)),
            endTime: startOfDay.add(Duration(hours: 11)),
            userId: 'user123',
            salesPointId: 'point1',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];

        when(mockRepository.getCalendarEntries(
          userId: anyNamed('userId'),
          startDate: anyNamed('startDate'),
          endDate: anyNamed('endDate'),
        )).thenAnswer((_) async => entries);

        // Carica le voci
        await container.read(calendarNotifierProvider.notifier).loadCalendarEntries(
          userId: 'user123',
        );

        // Act
        final todayEntries = container.read(todayCalendarEntriesProvider);

        // Assert
        expect(todayEntries, hasLength(1));
        expect(todayEntries.first.title, equals('Appuntamento Oggi'));
      });
    });
  });
} 