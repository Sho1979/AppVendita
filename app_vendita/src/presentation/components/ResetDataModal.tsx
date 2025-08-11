import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform, Switch } from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface ResetDataModalProps {
  visible: boolean;
  salesPointName: string;
  onCancel: () => void;
  onConfirm: (options: { deletePhotos: boolean }) => void;
}

const ResetDataModal: React.FC<ResetDataModalProps> = ({ visible, salesPointName, onCancel, onConfirm }) => {
  const [deletePhotos, setDeletePhotos] = useState<boolean>(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Reset dati</Text>
          <Text style={styles.subtitle}>Stai per cancellare entries, tag, vendite, azioni e note per "{salesPointName}".</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Elimina anche foto collegate</Text>
            <Switch value={deletePhotos} onValueChange={setDeletePhotos} />
          </View>

          <View style={styles.actions}>
            <SafeTouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
              <Text style={styles.buttonTextCancel}>Annulla</Text>
            </SafeTouchableOpacity>
            <SafeTouchableOpacity style={[styles.button, styles.danger]} onPress={() => onConfirm({ deletePhotos })}>
              <Text style={styles.buttonTextDanger}>Cancella</Text>
            </SafeTouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.medium,
  },
  card: {
    width: Platform.OS === 'web' ? 460 : '95%',
    backgroundColor: Colors.warmBackground,
    borderRadius: 12,
    padding: Spacing.large,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0,0,0,0.2)' } : { elevation: 6 }),
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.warmText,
  },
  subtitle: {
    marginTop: Spacing.small,
    fontSize: 14,
    color: Colors.warmTextSecondary,
  },
  optionRow: {
    marginTop: Spacing.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.warmText,
    fontWeight: '600',
  },
  actions: {
    marginTop: Spacing.large,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.small,
  },
  button: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    borderRadius: 8,
  },
  cancel: {
    backgroundColor: Colors.warmSurface,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  danger: {
    backgroundColor: Colors.warmError,
  },
  buttonTextCancel: {
    color: Colors.warmTextSecondary,
    fontWeight: '700',
  },
  buttonTextDanger: {
    color: Colors.warmBackground,
    fontWeight: '800',
  },
});

export default ResetDataModal;


