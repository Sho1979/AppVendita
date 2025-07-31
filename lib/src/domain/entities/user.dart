import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

/// Entità che rappresenta un utente del sistema.
/// 
/// Questa classe è immutabile e rappresenta un utente
/// del sistema di vendita (agente, manager, amministratore).
@freezed
class User with _$User {
  /// Crea un nuovo utente.
  /// 
  /// [id] - Identificatore univoco dell'utente
  /// [email] - Email dell'utente
  /// [name] - Nome completo dell'utente
  /// [role] - Ruolo dell'utente (agent, manager, admin)
  /// [salesPointId] - ID del punto vendita associato (opzionale)
  /// [phone] - Numero di telefono dell'utente
  /// [isActive] - Se l'utente è attivo nel sistema
  /// [createdAt] - Data di creazione dell'utente
  /// [updatedAt] - Data dell'ultimo aggiornamento
  const factory User({
    required String id,
    required String email,
    required String name,
    @Default('agent') String role,
    String? salesPointId,
    String? phone,
    @Default(true) bool isActive,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;

  /// Crea un'istanza da JSON.
  factory User.fromJson(Map<String, dynamic> json) =>
      _$UserFromJson(json);
} 