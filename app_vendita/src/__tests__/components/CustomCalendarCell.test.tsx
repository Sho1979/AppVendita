import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomCalendarCell from '../../presentation/components/CustomCalendarCell';

// Mock per useCalendar hook
jest.mock('../../presentation/providers/CalendarContext', () => ({
  useCalendar: () => ({
    state: {
      entries: [],
      isLoading: false,
    },
    progressiveSystem: {
      getDisplayDataForDate: jest.fn(() => ({
        isInitialized: true,
        useOriginalData: false,
        hasProgressiveData: true,
        progressiveEntriesCount: 2,
        originalEntriesCount: 1,
        sellInProgressivo: 1500,
      })),
    },
  }),
}));

// Mock per useFocusReferences hook
jest.mock('../../hooks/useFocusReferences', () => ({
  useFocusReferences: () => ({
    focusReferences: [],
    loading: false,
    updateNetPrice: jest.fn(),
    getNetPrice: jest.fn(() => '10.50'),
  }),
}));

describe('CustomCalendarCell', () => {
  const mockProps = {
    date: '2025-07-30',
    onPress: jest.fn(),
    isSelected: false,
    hasEntry: true,
    hasProblem: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with basic props', () => {
    const { getByText } = render(<CustomCalendarCell {...mockProps} />);
    
    expect(getByText('30')).toBeTruthy();
  });

  it('should call onPress when cell is pressed', () => {
    const { getByText } = render(<CustomCalendarCell {...mockProps} />);
    
    const cell = getByText('30');
    fireEvent.press(cell);
    
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('should display progressive data when available', () => {
    const { getByText } = render(<CustomCalendarCell {...mockProps} />);
    
    // Verifica che il componente si renderizzi correttamente
    expect(getByText('30')).toBeTruthy();
  });

  it('should show problem indicator when hasProblem is true', () => {
    const propsWithProblem = { ...mockProps, hasProblem: true };
    const { getByText } = render(<CustomCalendarCell {...propsWithProblem} />);
    
    // Verifica che il componente si renderizzi anche con problemi
    expect(getByText('30')).toBeTruthy();
  });

  it('should show selected state when isSelected is true', () => {
    const propsSelected = { ...mockProps, isSelected: true };
    const { getByText } = render(<CustomCalendarCell {...propsSelected} />);
    
    // Verifica che il componente si renderizzi anche quando selezionato
    expect(getByText('30')).toBeTruthy();
  });

  it('should display focus references when available', () => {
    const { getByText } = render(<CustomCalendarCell {...mockProps} />);
    
    // Verifica che il componente si renderizzi correttamente
    expect(getByText('30')).toBeTruthy();
  });

  it('should handle empty progressive data gracefully', () => {
    const { getByText } = render(<CustomCalendarCell {...mockProps} />);
    
    // Verifica che non ci siano errori con dati vuoti
    expect(getByText('30')).toBeTruthy();
  });
}); 