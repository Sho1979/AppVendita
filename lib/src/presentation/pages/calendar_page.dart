import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

import '../providers/calendar_providers.dart';
import '../widgets/calendar_entry_card.dart';
import '../widgets/error_widget.dart';
import '../widgets/loading_widget.dart';

/// Pagina principale del calendario di vendita.
/// 
/// Mostra un calendario interattivo con le voci del calendario
/// e gestisce gli stati di loading, error e data.
class CalendarPage extends StatefulWidget {
  /// Crea una nuova istanza della pagina del calendario.
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  late CalendarNotifier _calendarNotifier;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _calendarNotifier = CalendarNotifier();
    _calendarNotifier.addListener(_onCalendarStateChanged);
    _loadCalendarEntries();
  }

  @override
  void dispose() {
    _calendarNotifier.removeListener(_onCalendarStateChanged);
    _calendarNotifier.dispose();
    super.dispose();
  }

  void _onCalendarStateChanged() {
    setState(() {});
  }

  /// Carica le voci del calendario per l'utente corrente.
  /// 
  /// In un'app reale, l'ID utente dovrebbe essere ottenuto
  /// dal sistema di autenticazione.
  void _loadCalendarEntries() {
    const userId = 'user123'; // Placeholder - dovrebbe essere dinamico
    _calendarNotifier.loadCalendarEntries(
      userId: userId,
    );
  }

  @override
  Widget build(BuildContext context) {
    final calendarState = _calendarNotifier.state;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calendario Vendite'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEntryDialog(context),
            tooltip: 'Aggiungi appuntamento',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCalendarEntries,
            tooltip: 'Aggiorna calendario',
          ),
        ],
      ),
      body: Column(
        children: [
          // Calendario
          _buildCalendar(),
          
          // Lista delle voci del calendario
          Expanded(
            child: _buildCalendarEntriesList(calendarState),
          ),
        ],
      ),
    );
  }

  /// Costruisce il widget del calendario.
  Widget _buildCalendar() {
    return Card(
      margin: const EdgeInsets.all(8),
      child: TableCalendar<CalendarEntry>(
        firstDay: DateTime.utc(2020, 1, 1),
        lastDay: DateTime.utc(2030, 12, 31),
        focusedDay: _focusedDay,
        selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
        eventLoader: (day) => _getEventsForDay(day),
        onDaySelected: (selectedDay, focusedDay) {
          setState(() {
            _selectedDay = selectedDay;
            _focusedDay = focusedDay;
          });
        },
        onPageChanged: (focusedDay) {
          setState(() {
            _focusedDay = focusedDay;
          });
        },
        calendarFormat: CalendarFormat.month,
        startingDayOfWeek: StartingDayOfWeek.monday,
        headerStyle: const HeaderStyle(
          formatButtonVisible: false,
          titleCentered: true,
        ),
        calendarStyle: const CalendarStyle(
          selectedDecoration: BoxDecoration(
            color: Colors.blue,
            shape: BoxShape.circle,
          ),
          todayDecoration: BoxDecoration(
            color: Colors.orange,
            shape: BoxShape.circle,
          ),
          markerDecoration: BoxDecoration(
            color: Colors.red,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }

  /// Costruisce la lista delle voci del calendario.
  Widget _buildCalendarEntriesList(CalendarState calendarState) {
    if (calendarState.isLoading) {
      return const LoadingWidget();
    }

    if (calendarState.error != null) {
      return ErrorWidget(
        message: calendarState.error!,
        onRetry: _loadCalendarEntries,
      );
    }

    final selectedDayEntries = _getEventsForDay(_selectedDay!);

    if (selectedDayEntries.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: selectedDayEntries.length,
      itemBuilder: (context, index) {
        final entry = selectedDayEntries[index];
        return CalendarEntryCard(
          entry: entry,
          onEdit: () => _showEditEntryDialog(context, entry),
          onDelete: () => _showDeleteConfirmation(context, entry),
        );
      },
    );
  }

  /// Costruisce lo stato vuoto quando non ci sono voci.
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_busy,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Nessun appuntamento per ${_formatDate(_selectedDay!)}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tocca il pulsante + per aggiungere un nuovo appuntamento',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  /// Ottiene gli eventi per un giorno specifico.
  List<CalendarEntry> _getEventsForDay(DateTime day) {
    final calendarState = _calendarNotifier.state;
    
    if (calendarState.isLoading || calendarState.error != null) {
      return [];
    }

    return calendarState.entries.where((entry) {
      return isSameDay(entry.startTime, day);
    }).toList();
  }

  /// Formatta una data per la visualizzazione.
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  /// Mostra il dialog per aggiungere una nuova voce.
  void _showAddEntryDialog(BuildContext context) {
    // TODO: Implementare il dialog per aggiungere una nuova voce
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funzionalità di aggiunta in sviluppo'),
      ),
    );
  }

  /// Mostra il dialog per modificare una voce esistente.
  void _showEditEntryDialog(BuildContext context, CalendarEntry entry) {
    // TODO: Implementare il dialog per modificare una voce
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funzionalità di modifica in sviluppo'),
      ),
    );
  }

  /// Mostra la conferma per eliminare una voce.
  void _showDeleteConfirmation(BuildContext context, CalendarEntry entry) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Conferma eliminazione'),
        content: Text('Sei sicuro di voler eliminare "${entry.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annulla'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteEntry(entry);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Elimina'),
          ),
        ],
      ),
    );
  }

  /// Elimina una voce del calendario.
  void _deleteEntry(CalendarEntry entry) {
    _calendarNotifier.deleteCalendarEntry(entry.id);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Appuntamento "${entry.title}" eliminato'),
        action: SnackBarAction(
          label: 'Annulla',
          onPressed: () {
            // TODO: Implementare l'annullamento dell'eliminazione
          },
        ),
      ),
    );
  }
} 