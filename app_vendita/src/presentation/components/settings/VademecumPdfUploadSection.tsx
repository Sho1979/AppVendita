import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
// RIMOSSO upload su Storage per evitare costi: parsing locale + scrittura Firestore
import { vademecumImportService } from '../../../services/VademecumImportService';
import { extractPdfText, parseVademecumText } from '../../../services/VademecumPdfParser';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

type Channel = 'FOOD' | 'DIY';

function getTargetFolder(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 2).padStart(2, '0'); // mese prossimo
  return `${y}-${m}`;
}

export default function VademecumPdfUploadSection() {
  const [isUploading, setIsUploading] = useState(false);
  const targetFolder = useMemo(() => getTargetFolder(), []);

  const pickAndUpload = async (channel: Channel) => {
    try {
      setIsUploading(true);
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      // Parsing locale PDF → righe normalizzate → import su Firestore
      const { pages } = await extractPdfText(file.uri);
      const rows = parseVademecumText(channel, pages, `${targetFolder}/${channel}.pdf`);
      // Debug: mostra primi 5 record trasformati in console
      if (__DEV__) {
        // Evita log troppo grandi
        console.log(`🧩 Parser Vademecum ${channel}: righe estratte =`, rows.length);
        console.log(`🧩 Prime 5 righe ${channel}:`, rows.slice(0, 5));
      }
      // Salva raw anche in Firestore per audit e reuse futuro
      await vademecumImportService.saveRawForAudit(rows, targetFolder, `${targetFolder}/${channel}.pdf`);
      // Se il file è di Agosto (dal nome), usa fallback Agosto anno corrente per righe senza date
      const isAugust = /08|agosto|aug/i.test(targetFolder) || /agosto|aug|08/i.test(file.name);
      const now = new Date();
      const fallbackMonth = isAugust ? 8 : (now.getMonth() + 2); // default mese prossimo
      const fallbackYear = now.getFullYear();
      const imported = await vademecumImportService.importRows(rows, `${targetFolder}/${channel}.pdf`, { fallbackMonth, fallbackYear });
      Alert.alert('Import completato', `${imported} attività create da ${channel}.pdf`);
    } catch (e) {
      console.error('❌ Upload PDF fallito', e);
      Alert.alert('Errore', 'Impossibile caricare il PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload PDF Vademecum</Text>
      <Text style={styles.subtitle}>Cartella di destinazione: vademecum/{targetFolder}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, isUploading && styles.buttonDisabled]} onPress={() => pickAndUpload('FOOD')} disabled={isUploading}>
          <Text style={styles.buttonText}>{isUploading ? 'Caricamento…' : 'Carica PDF FOOD'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, isUploading && styles.buttonDisabled]} onPress={() => pickAndUpload('DIY')} disabled={isUploading}>
          <Text style={styles.buttonText}>{isUploading ? 'Caricamento…' : 'Carica PDF DIY'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Lo step di parsing automatico scriverà le attività nelle collection dedicate.</Text>
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
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.small,
    marginBottom: Spacing.small,
  },
  button: {
    flex: 1,
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
  hint: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});


