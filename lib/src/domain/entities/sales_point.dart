import 'package:freezed_annotation/freezed_annotation.dart';

part 'sales_point.freezed.dart';
part 'sales_point.g.dart';

/// Entità che rappresenta un punto vendita.
/// 
/// Questa classe è immutabile e rappresenta un punto vendita
/// associato a un agente di vendita.
@freezed
class SalesPoint with _$SalesPoint {
  /// Crea un nuovo punto vendita.
  /// 
  /// [id] - Identificatore univoco del punto vendita
  /// [name] - Nome del punto vendita
  /// [address] - Indirizzo del punto vendita
  /// [city] - Città del punto vendita
  /// [province] - Provincia del punto vendita
  /// [phone] - Numero di telefono del punto vendita
  /// [email] - Email di contatto del punto vendita
  /// [managerId] - ID del manager responsabile
  /// [createdAt] - Data di creazione del punto vendita
  /// [updatedAt] - Data dell'ultimo aggiornamento
  const factory SalesPoint({
    required String id,
    required String name,
    required String address,
    required String city,
    required String province,
    String? phone,
    String? email,
    required String managerId,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _SalesPoint;

  /// Crea un'istanza da JSON.
  factory SalesPoint.fromJson(Map<String, dynamic> json) =>
      _$SalesPointFromJson(json);
} 