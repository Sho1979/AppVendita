import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';
import InputField from './InputField';

export default function InputFieldTest() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [text3, setText3] = useState('');
  const [text4, setText4] = useState('');
  const [text5, setText5] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Test InputField Component</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input Base</Text>
        <InputField
          label="Nome Cliente"
          placeholder="Inserisci il nome del cliente"
          value={text1}
          onChangeText={setText1}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input con Validazione</Text>
        <InputField
          label="Email"
          placeholder="Inserisci la tua email"
          value={text2}
          onChangeText={setText2}
          error={text2 && !text2.includes('@') ? 'Email non valida' : null}
          helperText="Inserisci un indirizzo email valido"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input Richiesto</Text>
        <InputField
          label="Importo Vendita"
          placeholder="0.00"
          value={text3}
          onChangeText={setText3}
          required
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input con Icone</Text>
        <InputField
          label="Cerca Prodotto"
          placeholder="Cerca prodotti..."
          value={text4}
          onChangeText={setText4}
          leftIcon={<Text style={styles.icon}>🔍</Text>}
          rightIcon={<Text style={styles.icon}>📦</Text>}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input Varianti</Text>

        <Text style={styles.subtitle}>Small Size</Text>
        <InputField
          label="Codice"
          placeholder="ABC123"
          value={text5}
          onChangeText={setText5}
          size="small"
        />

        <Text style={styles.subtitle}>Large Size</Text>
        <InputField
          label="Note"
          placeholder="Inserisci note aggiuntive..."
          size="large"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.subtitle}>Filled Variant</Text>
        <InputField
          label="Descrizione"
          placeholder="Descrizione prodotto"
          variant="filled"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Input con Errori</Text>
        <InputField
          label="Password"
          placeholder="Inserisci password"
          secureTextEntry
          error="La password deve contenere almeno 8 caratteri"
        />
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
  icon: {
    fontSize: 16,
  },
});
