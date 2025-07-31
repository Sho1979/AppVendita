import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';
import DatePicker from './DatePicker';

export default function DatePickerTest() {
  const [date1, setDate1] = useState<Date | undefined>();
  const [date2, setDate2] = useState<Date | undefined>();
  const [date3, setDate3] = useState<Date | undefined>();
  const [date4, setDate4] = useState<Date | undefined>();


  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Test DatePicker Component</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker Base</Text>
        <DatePicker
          label="Data Vendita"
          placeholder="Seleziona la data di vendita"
          value={date1}
          onChange={setDate1}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker con Validazione</Text>
        <DatePicker
          label="Data Consegna"
          placeholder="Seleziona data consegna"
          value={date2}
          onChange={setDate2}
          error={
            date2 && date2 < today
              ? 'La data non può essere nel passato'
              : null
          }
          helperText="Seleziona una data futura"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker Richiesto</Text>
        <DatePicker
          label="Data Scadenza"
          placeholder="Seleziona data scadenza"
          value={date3}
          onChange={setDate3}
          required
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker con Range</Text>
        <DatePicker
          label="Data Evento"
          placeholder="Seleziona data evento"
          value={date4}
          onChange={setDate4}
          minDate={minDate}
          maxDate={maxDate}
          helperText={`Solo date tra ${minDate.toLocaleDateString('it-IT')} e ${maxDate.toLocaleDateString('it-IT')}`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker Varianti</Text>

        <Text style={styles.subtitle}>Small Size</Text>
        <DatePicker
          label="Data Piccola"
          placeholder="Data piccola"
          size="small"
        />

        <Text style={styles.subtitle}>Large Size</Text>
        <DatePicker
          label="Data Grande"
          placeholder="Data grande"
          size="large"
        />

        <Text style={styles.subtitle}>Filled Variant</Text>
        <DatePicker
          label="Data Filled"
          placeholder="Data filled"
          variant="filled"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker Disabilitato</Text>
        <DatePicker
          label="Data Disabilitata"
          placeholder="Non selezionabile"
          disabled
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 DatePicker con Errore</Text>
        <DatePicker
          label="Data con Errore"
          placeholder="Data con errore"
          error="Data non valida"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Stato Attuale</Text>
        <Text style={styles.statusText}>
          Data 1:{' '}
          {date1 ? date1.toLocaleDateString('it-IT') : 'Non selezionata'}
        </Text>
        <Text style={styles.statusText}>
          Data 2:{' '}
          {date2 ? date2.toLocaleDateString('it-IT') : 'Non selezionata'}
        </Text>
        <Text style={styles.statusText}>
          Data 3:{' '}
          {date3 ? date3.toLocaleDateString('it-IT') : 'Non selezionata'}
        </Text>
        <Text style={styles.statusText}>
          Data 4:{' '}
          {date4 ? date4.toLocaleDateString('it-IT') : 'Non selezionata'}
        </Text>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBackground,
    padding: Spacing.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.large,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.medium,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmTextSecondary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  statusText: {
    fontSize: 14,
    color: Colors.warmText,
    marginBottom: Spacing.xs,
  },
});
