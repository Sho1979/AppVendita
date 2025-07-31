import 'package:flutter/material.dart';

/// Widget per mostrare lo stato di caricamento.
/// 
/// Fornisce un indicatore di caricamento elegante con
/// un messaggio personalizzabile.
class LoadingWidget extends StatelessWidget {
  /// Crea una nuova istanza del widget di loading.
  /// 
  /// [message] - Messaggio da mostrare durante il caricamento
  const LoadingWidget({
    super.key,
    this.message = 'Caricamento in corso...',
  });

  /// Messaggio da mostrare durante il caricamento.
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
} 