import 'package:flutter/material.dart';

/// Widget per mostrare gli errori con opzione di retry.
/// 
/// Fornisce una visualizzazione elegante degli errori
/// con un pulsante per riprovare l'operazione.
class ErrorWidget extends StatelessWidget {
  /// Crea una nuova istanza del widget di errore.
  /// 
  /// [message] - Messaggio di errore da mostrare
  /// [onRetry] - Callback chiamato quando si preme il pulsante riprova
  const ErrorWidget({
    super.key,
    required this.message,
    required this.onRetry,
  });

  /// Messaggio di errore da mostrare.
  final String message;

  /// Callback chiamato quando si preme il pulsante riprova.
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Si è verificato un errore',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.red[700],
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Riprova'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
} 