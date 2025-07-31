import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

import 'src/core/utils/logger_config.dart';
import 'src/presentation/pages/calendar_page.dart';

/// Punto di ingresso dell'applicazione AppVendita.
/// 
/// Inizializza Firebase e il sistema di logging,
/// poi avvia l'applicazione con la configurazione appropriata.
void main() async {
  // Assicurati che Flutter sia inizializzato
  WidgetsFlutterBinding.ensureInitialized();

  // Configura il logging per l'ambiente di sviluppo
  LoggerConfig.configureForDevelopment();

  // Inizializza Firebase (commentato per ora per testare senza Firebase)
  // await Firebase.initializeApp();

  // Avvia l'applicazione
  runApp(const AppVenditaApp());
}

/// Widget principale dell'applicazione AppVendita.
/// 
/// Configura il tema dell'applicazione e gestisce la navigazione
/// tra le diverse pagine dell'app.
class AppVenditaApp extends StatelessWidget {
  /// Crea una nuova istanza dell'applicazione.
  const AppVenditaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AppVendita',
      theme: ThemeData(
        // Tema personalizzato per l'applicazione
        primarySwatch: Colors.blue,
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
          elevation: 2,
        ),
        cardTheme: const CardTheme(
          elevation: 2,
          margin: EdgeInsets.all(8),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      home: const CalendarPage(),
      debugShowCheckedModeBanner: false,
    );
  }
} 