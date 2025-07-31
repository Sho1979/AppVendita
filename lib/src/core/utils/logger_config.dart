import 'package:logging/logging.dart';

/// Configurazione del sistema di logging dell'applicazione.
/// 
/// Fornisce una configurazione centralizzata per il logging
/// che può essere facilmente modificata per diversi ambienti.
class LoggerConfig {
  /// Inizializza il sistema di logging.
  /// 
  /// [level] - Livello di logging (default: Level.INFO)
  /// [enableConsoleOutput] - Se abilitare l'output su console
  static void initialize({
    Level level = Level.INFO,
    bool enableConsoleOutput = true,
  }) {
    // Configura il logger root
    Logger.root.level = level;
    
    if (enableConsoleOutput) {
      Logger.root.onRecord.listen((record) {
        // Formato: [LEVEL] LOGGER_NAME: MESSAGE
        print('${record.level.name} ${record.loggerName}: ${record.message}');
        
        // Se c'è un'eccezione, stampala
        if (record.error != null) {
          print('Error: ${record.error}');
        }
        
        // Se ci sono stack trace, stampali
        if (record.stackTrace != null) {
          print('Stack trace: ${record.stackTrace}');
        }
      });
    }
  }

  /// Crea un logger per una classe specifica.
  /// 
  /// [className] - Nome della classe per il logger
  /// 
  /// Restituisce un logger configurato per la classe specificata.
  static Logger getLogger(String className) {
    return Logger(className);
  }

  /// Configurazione per l'ambiente di sviluppo.
  static void configureForDevelopment() {
    initialize(
      level: Level.ALL,
      enableConsoleOutput: true,
    );
  }

  /// Configurazione per l'ambiente di produzione.
  static void configureForProduction() {
    initialize(
      level: Level.WARNING,
      enableConsoleOutput: false, // In produzione, potremmo voler inviare i log a un servizio esterno
    );
  }

  /// Configurazione per i test.
  static void configureForTesting() {
    initialize(
      level: Level.SEVERE, // Solo errori critici durante i test
      enableConsoleOutput: false,
    );
  }
} 