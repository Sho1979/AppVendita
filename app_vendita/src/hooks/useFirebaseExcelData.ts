import { useState, useEffect, useCallback } from 'react';
import { FirebaseCalendarRepository } from '../data/repositories/firebaseCalendarRepository';

export interface ExcelDataRow {
  id: string;
  linea?: string;
  codiceAreaManager?: string;
  codiceNam?: string;
  codiceAgente?: string;
  nomeAgente?: string;
  insegna?: string;
  codiceCliente?: string;
  cliente?: string;
  [key: string]: any; // Per altri campi dinamici
}

export const useFirebaseExcelData = () => {
  const [excelData, setExcelData] = useState<ExcelDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const repository = new FirebaseCalendarRepository();

  // Funzione helper per trovare il valore di un campo con più varianti
  const findFieldValue = (row: any, fieldVariants: string[]): string => {
    for (const variant of fieldVariants) {
      if (row[variant] && row[variant] !== '') {
        return String(row[variant]);
      }
    }
    return '';
  };

  // Funzione helper per estrarre l'insegna dal nome del punto vendita
  const extractInsegna = (salesPointName: string): string => {
    if (!salesPointName) return '';
    
    // Rimuovi spazi extra e normalizza
    const name = salesPointName.trim();
    
    // Casi specifici per estrarre l'insegna principale
    if (name.includes('Brico IO') || name.includes('Brico Io')) {
      return 'Brico IO';
    }
    if (name.includes('Bricocenter')) {
      return 'Bricocenter';
    }
    if (name.includes('Bricofer')) {
      return 'Bricofer';
    }
    if (name.includes('Ciesseci')) {
      return 'Ciesseci';
    }
    if (name.includes('OBI') || name.includes('Obi')) {
      return 'OBI';
    }
    if (name.includes('Tecnomat')) {
      return 'Tecnomat';
    }
    if (name.includes('Steflor')) {
      return 'Steflor';
    }
    if (name.includes('Risparmio Casa')) {
      return 'Risparmio Casa';
    }
    if (name.includes('Leroy Merlin')) {
      return 'Leroy Merlin';
    }
    if (name.includes('Eurobrico')) {
      return 'Eurobrico';
    }
    if (name.includes('Brico Ok')) {
      return 'Brico Ok';
    }
    if (name.includes('Bricoio')) {
      return 'Bricoio';
    }
    if (name.includes('Bricolarge')) {
      return 'Bricolarge';
    }
    if (name.includes('Bricopoint')) {
      return 'Bricopoint';
    }
    if (name.includes('BricoSiena')) {
      return 'BricoSiena';
    }
    if (name.includes('Bricolage')) {
      return 'Bricolage';
    }
    if (name.includes('Bricolarge')) {
      return 'Bricolarge';
    }
    if (name.includes('Cipir')) {
      return 'Cipir';
    }
    if (name.includes('G.S. Distribuzione')) {
      return 'G.S. Distribuzione';
    }
    if (name.includes('Delta Discount')) {
      return 'Delta Discount';
    }
    if (name.includes('Eurocolor')) {
      return 'Eurocolor';
    }
    if (name.includes('Free Time')) {
      return 'Free Time';
    }
    if (name.includes('Garden')) {
      return 'Garden';
    }
    if (name.includes('Geco Supermercati')) {
      return 'Geco Supermercati';
    }
    if (name.includes('Hobby Legno')) {
      return 'Hobby Legno';
    }
    if (name.includes('Idro Zeta')) {
      return 'Idro Zeta';
    }
    if (name.includes('Il Bottegone')) {
      return 'Il Bottegone';
    }
    if (name.includes('La Prealpina')) {
      return 'La Prealpina';
    }
    if (name.includes('Pruna Trading')) {
      return 'Pruna Trading';
    }
    if (name.includes('Sea Ingross')) {
      return 'Sea Ingross';
    }
    if (name.includes('Tec S.r.l.') || name.includes('TEC S.r.l.')) {
      return 'Tec';
    }
    if (name.includes('Unipam')) {
      return 'Unipam';
    }
    if (name.includes('Viridea')) {
      return 'Viridea';
    }
    
    // Rimuovi suffissi comuni come "s.r.l.", "S.r.l.", "SRL", "S.p.a.", ecc.
    let cleanName = name
      .replace(/\s+(s\.r\.l\.|S\.r\.l\.|SRL|S\.p\.a\.|SPA|S\.n\.c\.|SNC|S\.a\.s\.|SAS)\s*$/i, '')
      .replace(/\s+(franch\.|franchise|franchising)\s*/i, '')
      .replace(/\s+(cod\.|codice)\s+n\.\s*\d+.*$/i, '')
      .replace(/\s+[A-Z]{2,}\s*$/i, '') // Rimuovi codici di provincia alla fine
      .trim();
    
    // Se il nome pulito è diverso dall'originale, prova a estrarre l'insegna
    if (cleanName !== name) {
      // Prova a estrarre la prima parte significativa
      const parts = cleanName.split(/[-\s]+/);
      if (parts.length >= 2) {
        // Se ci sono almeno 2 parti, prendi le prime 2 parole come insegna
        return parts.slice(0, 2).join(' ');
      }
      return cleanName;
    }
    
    // Fallback: prendi la prima parte prima di un trattino o della prima parola che sembra una città
    const parts = name.split(/[-\s]+/);
    if (parts.length >= 2) {
      // Se ci sono almeno 2 parti, prendi le prime 2 parole come insegna
      return parts.slice(0, 2).join(' ');
    }
    
    // Se non riesci a estrarre, restituisci il nome completo
    return name;
  };

  const loadExcelData = useCallback(async () => {
    console.log('📊 useFirebaseExcelData: Caricamento dati Excel da Firebase...');
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 useFirebaseExcelData: Chiamata repository.getExcelData()...');
      const data = await repository.getExcelData();
      console.log('✅ useFirebaseExcelData: Dati Excel caricati da Firebase:', data.length, 'righe');
      
      // Debug: mostra la struttura dei primi 3 record
      if (data.length > 0) {
        console.log('🔍 useFirebaseExcelData: Struttura dati raw (primi 3 record):', 
          data.slice(0, 3).map(row => {
            const keys = Object.keys(row);
            return {
              id: row.id,
              keys: keys,
              sampleValues: keys.slice(0, 10).map(key => ({ [key]: row[key] }))
            };
          })
        );
        
        // Debug: mostra tutti i campi disponibili nel primo record
        if (data[0]) {
          console.log('🔍 useFirebaseExcelData: Tutti i campi disponibili nel primo record:', 
            Object.keys(data[0]).map(key => `${key}: ${data[0][key]}`)
          );
        }
      } else {
        console.log('⚠️ useFirebaseExcelData: Nessun dato Excel trovato in Firebase');
      }
      
      // Normalizza i dati per compatibilità con i filtri esistenti
      const normalizedData = data.map((row, index) => {
        const normalized = {
          id: row.id || `excel_${index}`,
          // Linea - più varianti possibili
          linea: findFieldValue(row, [
            'Linea', 'linea', 'LINEA', 'Linea_', 'linea_', 'LINEA_',
            'liv', 'Liv', 'LIV', 'Liv_', 'liv_', 'LIV_',
            'line', 'Line', 'LINE', 'Line_', 'line_', 'LINE_'
          ]),
          // Area Manager - più varianti possibili
          codiceAreaManager: findFieldValue(row, [
            'Codice Area Manager', 'codiceAreaManager', 'CodiceAreaManager', 'codice_area_manager', 'codice_area_manager_',
            'amCode', 'am_code', 'AMCode', 'AM_Code', // Nomi reali da Firebase
            'am', 'AM', 'am_', 'AM_', 'area_manager', 'Area_Manager', 'area_manager_', 'Area_Manager_',
            'codice_am', 'Codice_AM', 'codice_am_', 'Codice_AM_',
            'area_manager_code', 'Area_Manager_Code', 'area_manager_code_', 'Area_Manager_Code_'
          ]),
          // NAM Code - più varianti possibili
          codiceNam: findFieldValue(row, [
            'Codice Nam', 'codiceNam', 'CodiceNam', 'codice_nam', 'codice_nam_',
            'namCode', 'nam_code', 'NAMCode', 'NAM_Code', // Nomi reali da Firebase
            'nam', 'NAM', 'nam_', 'NAM_', 'nam_code', 'NAM_Code', 'nam_code_', 'NAM_Code_',
            'codice_nam_code', 'Codice_NAM_Code', 'codice_nam_code_', 'Codice_NAM_Code_'
          ]),
          // Agente - più varianti possibili
          codiceAgente: findFieldValue(row, [
            'Codige Agente', 'codiceAgente', 'CodiceAgente', 'codice_agente', 'codice_agente_',
            'agenteCode', 'agente_code', 'AgenteCode', 'Agente_Code', // Nomi reali da Firebase
            'agente', 'Agente', 'AGENTE', 'agente_', 'Agente_', 'AGENTE_',
            'codice_agente_code', 'Codice_Agente_Code', 'codice_agente_code_', 'Codice_Agente_Code_',
            'agent', 'Agent', 'AGENT', 'agent_', 'Agent_', 'AGENT_'
          ]),
          // Nome Agente - più varianti possibili
          nomeAgente: findFieldValue(row, [
            'Nome Agente', 'nomeAgente', 'NomeAgente', 'nome_agente', 'nome_agente_',
            'agenteName', 'agente_name', 'AgenteName', 'Agente_Name', // Nomi reali da Firebase
            'realName', 'real_name', 'RealName', 'Real_Name', // Nomi reali da Firebase
            'nome', 'Nome', 'NOME', 'nome_', 'Nome_', 'NOME_',
            'agent_name', 'Agent_Name', 'agent_name_', 'Agent_Name_',
            'name', 'Name', 'NAME', 'name_', 'Name_', 'NAME_'
          ]),
          // Insegna - usa la colonna Insegna se disponibile, altrimenti level4
          insegna: findFieldValue(row, [
            'Insegna', 'insegna', 'Insegna', 'INSEGNA', 'insegna_', 'Insegna_', 'INSEGNA_',
            'level4', 'Level4', 'LEVEL4', 'level_4', 'Level_4', 'LEVEL_4',
            'brand', 'Brand', 'BRAND', 'brand_', 'Brand_', 'BRAND_',
            'marchio', 'Marchio', 'MARCHIO', 'marchio_', 'Marchio_', 'MARCHIO_'
          ]) || extractInsegna(findFieldValue(row, ['Cliente', 'cliente', 'salesPointName', 'sales_point_name', 'SalesPointName', 'Sales_Point_Name'])),
          // Codice Cliente - più varianti possibili
          codiceCliente: findFieldValue(row, [
            'Codice Cliente', 'codiceCliente', 'CodiceCliente', 'codice_cliente', 'codice_cliente_',
            'salesPointCode', 'sales_point_code', 'SalesPointCode', 'Sales_Point_Code', // Nomi reali da Firebase
            'codice', 'Codice', 'CODICE', 'codice_', 'Codice_', 'CODICE_',
            'client_code', 'Client_Code', 'client_code_', 'Client_Code_',
            'code', 'Code', 'CODE', 'code_', 'Code_', 'CODE_'
          ]),
          // Cliente - più varianti possibili
          cliente: findFieldValue(row, [
            'Cliente', 'cliente', 'Cliente', 'CLIENTE', 'cliente_', 'Cliente_', 'CLIENTE_',
            'salesPointName', 'sales_point_name', 'SalesPointName', 'Sales_Point_Name', // Nomi reali da Firebase
            'client', 'Client', 'CLIENT', 'client_', 'Client_', 'CLIENT_',
            'customer', 'Customer', 'CUSTOMER', 'customer_', 'Customer_', 'CUSTOMER_'
          ]),
          ...row // Mantieni tutti gli altri campi originali
        };
        
        // Debug: log per i primi 3 record normalizzati
        if (index < 3) {
          console.log(`🔍 useFirebaseExcelData: Record ${index + 1} normalizzato:`, {
            linea: normalized.linea,
            codiceAreaManager: normalized.codiceAreaManager,
            codiceNam: normalized.codiceNam,
            codiceAgente: normalized.codiceAgente,
            nomeAgente: normalized.nomeAgente,
            insegna: normalized.insegna,
            codiceCliente: normalized.codiceCliente,
            cliente: normalized.cliente
          });
        }
        
        return normalized;
      });
      
      console.log('✅ useFirebaseExcelData: Dati normalizzati pronti:', normalizedData.length, 'righe');
      setExcelData(normalizedData);
    } catch (err) {
      console.error('❌ useFirebaseExcelData: Errore nel caricamento dati Excel:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dati');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carica i dati all'inizializzazione
  useEffect(() => {
    console.log('🔄 useFirebaseExcelData: useEffect triggered - caricamento dati iniziali');
    loadExcelData();
  }, [loadExcelData]);

  // Funzione per ricaricare i dati
  const reloadData = useCallback(() => {
    console.log('🔄 useFirebaseExcelData: reloadData chiamato');
    loadExcelData();
  }, [loadExcelData]);

  return {
    excelData,
    isLoading,
    error,
    reloadData
  };
}; 