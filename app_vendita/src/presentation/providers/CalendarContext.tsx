import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';

// Tipi per lo stato
export interface ActiveFilters {
  userId: string;
  salesPointId: string;
  selectedDate: Date | null;
}

export interface CalendarState {
  entries: CalendarEntry[];
  users: User[];
  salesPoints: SalesPoint[];
  activeFilters: ActiveFilters;
  isLoading: boolean;
  error: string | null;
}

// Azioni per il reducer
export type CalendarAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTRIES'; payload: CalendarEntry[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_SALES_POINTS'; payload: SalesPoint[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<ActiveFilters> }
  | { type: 'ADD_ENTRY'; payload: CalendarEntry }
  | { type: 'UPDATE_ENTRY'; payload: CalendarEntry }
  | { type: 'DELETE_ENTRY'; payload: string };

// Stato iniziale
const initialState: CalendarState = {
  entries: [],
  users: [],
  salesPoints: [],
  activeFilters: {
    userId: '',
    salesPointId: '',
    selectedDate: null,
  },
  isLoading: false,
  error: null,
};

// Reducer
function calendarReducer(
  state: CalendarState,
  action: CalendarAction
): CalendarState {
  console.log(
    '🔄 CalendarReducer: Azione ricevuta:',
    action.type,
    action.payload
  );

  let newState: CalendarState;

  switch (action.type) {
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      console.log('⏳ CalendarReducer: Loading impostato a:', action.payload);
      break;

    case 'SET_ERROR':
      newState = { ...state, error: action.payload };
      console.log('❌ CalendarReducer: Errore impostato:', action.payload);
      break;

    case 'SET_ENTRIES':
      newState = { ...state, entries: action.payload };
      console.log(
        '📅 CalendarReducer: Entries aggiornati:',
        action.payload.length,
        'entries'
      );
      break;

    case 'SET_USERS':
      newState = { ...state, users: action.payload };
      console.log(
        '👥 CalendarReducer: Utenti aggiornati:',
        action.payload.length,
        'utenti'
      );
      break;

    case 'SET_SALES_POINTS':
      newState = { ...state, salesPoints: action.payload };
      console.log(
        '🏪 CalendarReducer: Punti vendita aggiornati:',
        action.payload.length,
        'punti vendita'
      );
      break;

    case 'UPDATE_FILTERS':
      newState = {
        ...state,
        activeFilters: { ...state.activeFilters, ...action.payload },
      };
      console.log('🔍 CalendarReducer: Filtri aggiornati:', action.payload);
      break;

    case 'ADD_ENTRY':
      newState = {
        ...state,
        entries: [...state.entries, action.payload],
      };
      console.log('➕ CalendarReducer: Entry aggiunta:', action.payload.id);
      break;

    case 'UPDATE_ENTRY':
      newState = {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
      console.log('✏️ CalendarReducer: Entry aggiornata:', action.payload.id);
      break;

    case 'DELETE_ENTRY':
      newState = {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload),
      };
      console.log('🗑️ CalendarReducer: Entry eliminata:', action.payload);
      break;

    default: {
      const neverAction = action as never;
      console.log('❓ CalendarReducer: Azione sconosciuta:', neverAction);
      return state;
    }
  }

  console.log('📊 CalendarReducer: Nuovo stato:', {
    entriesCount: newState.entries.length,
    usersCount: newState.users.length,
    salesPointsCount: newState.salesPoints.length,
    isLoading: newState.isLoading,
    error: newState.error,
    activeFilters: newState.activeFilters,
  });

  return newState;
}

// Context
interface CalendarContextType {
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// Provider
interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  console.log('🏗️ CalendarProvider: Provider inizializzato');

  try {
    const [state, dispatch] = useReducer(calendarReducer, initialState);
    console.log('✅ CalendarProvider: useReducer inizializzato con successo');

    console.log('📊 CalendarProvider: Stato iniziale del provider:', {
      entriesCount: state.entries.length,
      usersCount: state.users.length,
      salesPointsCount: state.salesPoints.length,
      isLoading: state.isLoading,
      error: state.error,
    });

    return (
      <CalendarContext.Provider value={{ state, dispatch }}>
        {children}
      </CalendarContext.Provider>
    );
  } catch (error) {
    console.error('❌ CalendarProvider: Errore critico nel provider:', error);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, color: '#ff0000' }}>
          Errore nel provider
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
          {error?.toString()}
        </Text>
      </View>
    );
  }
}

// Hook personalizzato
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    console.error('❌ useCalendar: Hook usato fuori dal CalendarProvider');
    throw new Error('useCalendar must be used within a CalendarProvider');
  }

  // Rimuoviamo questo log che causa re-render continui
  // console.log('🎯 useCalendar: Hook chiamato, stato corrente:', {
  //   entriesCount: context.state.entries.length,
  //   usersCount: context.state.users.length,
  //   salesPointsCount: context.state.salesPoints.length,
  //   isLoading: context.state.isLoading,
  // });

  return context;
}
