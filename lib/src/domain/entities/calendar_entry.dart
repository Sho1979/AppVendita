/// Entità che rappresenta una voce del calendario di vendita.
/// 
/// Questa classe è immutabile e rappresenta un appuntamento o evento
/// nel calendario di un agente di vendita.
class CalendarEntry {
  /// Crea una nuova voce del calendario.
  /// 
  /// [id] - Identificatore univoco della voce
  /// [title] - Titolo dell'appuntamento
  /// [description] - Descrizione dettagliata dell'appuntamento
  /// [startTime] - Data e ora di inizio
  /// [endTime] - Data e ora di fine
  /// [userId] - ID dell'utente proprietario della voce
  /// [salesPointId] - ID del punto vendita associato
  /// [status] - Stato dell'appuntamento (scheduled, completed, cancelled)
  /// [createdAt] - Data di creazione della voce
  /// [updatedAt] - Data dell'ultimo aggiornamento
  const CalendarEntry({
    required this.id,
    required this.title,
    required this.description,
    required this.startTime,
    required this.endTime,
    required this.userId,
    required this.salesPointId,
    this.status = 'scheduled',
    required this.createdAt,
    required this.updatedAt,
  });

  /// Identificatore univoco della voce.
  final String id;

  /// Titolo dell'appuntamento.
  final String title;

  /// Descrizione dettagliata dell'appuntamento.
  final String description;

  /// Data e ora di inizio.
  final DateTime startTime;

  /// Data e ora di fine.
  final DateTime endTime;

  /// ID dell'utente proprietario della voce.
  final String userId;

  /// ID del punto vendita associato.
  final String salesPointId;

  /// Stato dell'appuntamento (scheduled, completed, cancelled).
  final String status;

  /// Data di creazione della voce.
  final DateTime createdAt;

  /// Data dell'ultimo aggiornamento.
  final DateTime updatedAt;

  /// Crea una copia di questa voce con i valori aggiornati.
  CalendarEntry copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    String? userId,
    String? salesPointId,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CalendarEntry(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      userId: userId ?? this.userId,
      salesPointId: salesPointId ?? this.salesPointId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Crea un'istanza da JSON.
  factory CalendarEntry.fromJson(Map<String, dynamic> json) {
    return CalendarEntry(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      userId: json['userId'] as String,
      salesPointId: json['salesPointId'] as String,
      status: json['status'] as String? ?? 'scheduled',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// Converte questa istanza in JSON.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'userId': userId,
      'salesPointId': salesPointId,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CalendarEntry && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'CalendarEntry(id: $id, title: $title, startTime: $startTime)';
  }
} 