/// Classe base per tutte le eccezioni dell'applicazione.
/// 
/// Fornisce una struttura comune per la gestione degli errori
/// con messaggi localizzati e codici di errore.
abstract class AppException implements Exception {
  /// Crea una nuova eccezione dell'applicazione.
  /// 
  /// [message] - Messaggio descrittivo dell'errore
  /// [code] - Codice di errore per identificare il tipo di problema
  const AppException(this.message, this.code);

  /// Messaggio descrittivo dell'errore.
  final String message;

  /// Codice di errore per identificare il tipo di problema.
  final String code;

  @override
  String toString() => 'AppException: $message (Code: $code)';
}

/// Eccezione per errori di rete.
class NetworkException extends AppException {
  /// Crea una nuova eccezione di rete.
  const NetworkException(super.message, super.code);
}

/// Eccezione per errori di autenticazione.
class AuthenticationException extends AppException {
  /// Crea una nuova eccezione di autenticazione.
  const AuthenticationException(super.message, super.code);
}

/// Eccezione per errori di autorizzazione.
class AuthorizationException extends AppException {
  /// Crea una nuova eccezione di autorizzazione.
  const AuthorizationException(super.message, super.code);
}

/// Eccezione per errori di validazione dei dati.
class ValidationException extends AppException {
  /// Crea una nuova eccezione di validazione.
  const ValidationException(super.message, super.code);
}

/// Eccezione per errori del database.
class DatabaseException extends AppException {
  /// Crea una nuova eccezione del database.
  const DatabaseException(super.message, super.code);
} 