import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface SmartFilterComponentsProps {
  users: User[];
  salesPoints: SalesPoint[];
  selectedUserId?: string;
  selectedSalesPointId?: string;
  onUserChange: (userId: string) => void;
  onSalesPointChange: (salesPointId: string) => void;
  onSave: () => void;
  onReset: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FilterGroup {
  name: string;
  items: (User | SalesPoint)[];
  type: 'user' | 'salesPoint';
}

export default function SmartFilterComponents({
  users,
  salesPoints,
  selectedUserId,
  selectedSalesPointId,
  onUserChange,
  onSalesPointChange,
  onSave,
  onReset,
}: SmartFilterComponentsProps) {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'agents' | 'salesPoints'>('agents');
  const [showFavorites, setShowFavorites] = useState(false);

  // Raggruppa gli agenti per regione/provincia
  const agentGroups = useMemo(() => {
    const groups: { [key: string]: User[] } = {};
    
    users.forEach(user => {
      if (user.role === 'agent') {
        const region = user.region || 'Altri';
        if (!groups[region]) {
          groups[region] = [];
        }
        groups[region].push(user);
      }
    });

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items,
      type: 'user' as const,
    }));
  }, [users]);

  // Raggruppa i punti vendita per regione
  const salesPointGroups = useMemo(() => {
    const groups: { [key: string]: SalesPoint[] } = {};
    
    salesPoints.forEach(salesPoint => {
      const region = salesPoint.region || 'Altri';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(salesPoint);
    });

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items,
      type: 'salesPoint' as const,
    }));
  }, [salesPoints]);

  // Filtra i risultati in base al testo di ricerca
  const filteredGroups = useMemo(() => {
    const groups = activeTab === 'agents' ? agentGroups : salesPointGroups;
    
    if (!searchText.trim()) return groups;

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const searchLower = searchText.toLowerCase();
        if (group.type === 'user') {
          const user = item as User;
          return user.name.toLowerCase().includes(searchLower) ||
                 user.email?.toLowerCase().includes(searchLower) ||
                 user.region?.toLowerCase().includes(searchLower);
        } else {
          const salesPoint = item as SalesPoint;
          return salesPoint.name.toLowerCase().includes(searchLower) ||
                 salesPoint.address?.toLowerCase().includes(searchLower) ||
                 salesPoint.region?.toLowerCase().includes(searchLower);
        }
      }),
    })).filter(group => group.items.length > 0);
  }, [agentGroups, salesPointGroups, searchText, activeTab]);

  const handleQuickFilter = (type: 'all' | 'favorites' | 'recent') => {
    switch (type) {
      case 'all':
        onUserChange('');
        onSalesPointChange('');
        break;
      case 'favorites':
        setShowFavorites(!showFavorites);
        break;
      case 'recent':
        Alert.alert('Info', 'Funzionalità in sviluppo');
        break;
    }
  };

  const handleItemSelect = (item: User | SalesPoint, type: 'user' | 'salesPoint') => {
    if (type === 'user') {
      const user = item as User;
      onUserChange(selectedUserId === user.id ? '' : user.id);
    } else {
      const salesPoint = item as SalesPoint;
      onSalesPointChange(selectedSalesPointId === salesPoint.id ? '' : salesPoint.id);
    }
  };

  const getSelectedCount = () => {
    let count = 0;
    if (selectedUserId) count++;
    if (selectedSalesPointId) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      {/* Header con statistiche */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Filtri Intelligenti</Text>
        <Text style={styles.subtitle}>
          {users.length} agenti • {salesPoints.length} punti vendita
        </Text>
        {getSelectedCount() > 0 && (
          <Text style={styles.selectedCount}>
            {getSelectedCount()} filtro{getSelectedCount() > 1 ? 'i' : ''} attivo{getSelectedCount() > 1 ? 'i' : ''}
          </Text>
        )}
      </View>

      {/* Barra di ricerca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cerca agenti o punti vendita..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Tab di navigazione */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'agents' && styles.tabActive]}
          onPress={() => setActiveTab('agents')}
        >
          <Text style={[styles.tabText, activeTab === 'agents' && styles.tabTextActive]}>
            👤 Agenti ({users.filter(u => u.role === 'agent').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'salesPoints' && styles.tabActive]}
          onPress={() => setActiveTab('salesPoints')}
        >
          <Text style={[styles.tabText, activeTab === 'salesPoints' && styles.tabTextActive]}>
            🏪 Punti Vendita ({salesPoints.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtri rapidi */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.quickFilter, !selectedUserId && !selectedSalesPointId && styles.quickFilterActive]}
          onPress={() => handleQuickFilter('all')}
        >
          <Text style={[styles.quickFilterText, !selectedUserId && !selectedSalesPointId && styles.quickFilterTextActive]}>
            📋 Tutti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickFilter, showFavorites && styles.quickFilterActive]}
          onPress={() => handleQuickFilter('favorites')}
        >
          <Text style={[styles.quickFilterText, showFavorites && styles.quickFilterTextActive]}>
            ⭐ Preferiti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickFilter}
          onPress={() => handleQuickFilter('recent')}
        >
          <Text style={styles.quickFilterText}>
            ⏰ Recenti
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista risultati raggruppati */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {filteredGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.group}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item, itemIndex) => {
                const isSelected = group.type === 'user' 
                  ? selectedUserId === (item as User).id
                  : selectedSalesPointId === (item as SalesPoint).id;
                
                return (
                  <SafeTouchableOpacity
                    key={itemIndex}
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => handleItemSelect(item, group.type)}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {group.type === 'user' 
                        ? `👤 ${(item as User).name}`
                        : `🏪 ${(item as SalesPoint).name}`
                      }
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </SafeTouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        
        {filteredGroups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              🔍 Nessun risultato trovato
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Prova a modificare i criteri di ricerca
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Azioni */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>✅ Applica Filtri</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.medium,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  selectedCount: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: Spacing.small,
  },
  searchContainer: {
    padding: Spacing.medium,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: Spacing.medium,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.medium,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.medium,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickFilters: {
    flexDirection: 'row',
    padding: Spacing.medium,
    backgroundColor: Colors.surface,
  },
  quickFilter: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginRight: Spacing.small,
  },
  quickFilterActive: {
    backgroundColor: Colors.primary,
  },
  quickFilterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickFilterTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    padding: Spacing.medium,
  },
  group: {
    marginBottom: Spacing.large,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    paddingHorizontal: Spacing.small,
  },
  groupItems: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  itemText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.medium,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: Spacing.small,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: Spacing.small,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 