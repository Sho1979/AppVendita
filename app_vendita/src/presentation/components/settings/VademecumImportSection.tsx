import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { vademecumImportService } from '../../../services/VademecumImportService';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

export default function VademecumImportSection() {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/csv'] });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      const content = await fetch(file.uri).then(r => r.text());

      let rows: any[] = [];
      if (file.mimeType?.includes('csv') || file.name.endsWith('.csv')) {
        // CSV semplice: split per linee, prima riga header
        const lines = content.split(/\r?\n/).filter(Boolean);
        const header = lines.shift()!.split(',').map(s => s.trim());
        rows = lines.map(line => {
          const cols = line.split(',');
          const obj: any = {};
          header.forEach((h, i) => { obj[h] = cols[i]; });
          return obj;
        });
      } else {
        rows = JSON.parse(content);
      }

      const imported = await vademecumImportService.importRows(rows);
      Alert.alert('Import completato', `Caricate ${imported} attività dal Vademecum.`);
    } catch (e) {
      console.error('Import Vademecum fallito', e);
      Alert.alert('Errore', 'Impossibile importare il file.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Vademecum</Text>
      <Text style={styles.subtitle}>Importa JSON/CSV per popolare le attività FOOD/DIY (mese successivo)</Text>
      <TouchableOpacity style={[styles.button, isImporting && styles.buttonDisabled]} disabled={isImporting} onPress={handleImport}>
        <Text style={styles.buttonText}>{isImporting ? 'Import in corso…' : 'Importa JSON/CSV'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.medium,
    marginTop: Spacing.medium,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});


