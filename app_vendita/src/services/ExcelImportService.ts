import * as XLSX from 'xlsx';
import { Agent, AgentImportData, ExcelRowData } from '../data/models/Agent';
import { User } from '../data/models/User';
import { SalesPoint } from '../data/models/SalesPoint';
import { ExcelRow } from '../data/models/ExcelData';
import { PriceReference } from '../data/models/PriceReference';

export class ExcelImportService {
  
  /**
   * Trova il valore di una colonna ignorando maiuscole/minuscole
   */
  private static findColumnValue(row: any, columnName: string): any {
    const keys = Object.keys(row);
    const lowerColumnName = columnName.toLowerCase();
    
    // **DEBUG** - Vediamo cosa stiamo cercando
    if (columnName === 'brand' || columnName === 'sottobrand') {
      console.log(`🔍 findColumnValue cercando '${columnName}' in:`, keys);
    }
    
    // Cerca la chiave esatta (case-insensitive)
    for (const key of keys) {
      if (key.toLowerCase() === lowerColumnName) {
        if (columnName === 'brand' || columnName === 'sottobrand') {
          console.log(`✅ Trovato '${columnName}' come '${key}'`);
        }
        return row[key];
      }
    }
    
    // Cerca varianti comuni
    const variants = [
      columnName,
      columnName.toUpperCase(),
      columnName.toLowerCase(),
      columnName.charAt(0).toUpperCase() + columnName.slice(1).toLowerCase()
    ];
    
    for (const variant of variants) {
      if (row[variant] !== undefined) {
        if (columnName === 'brand' || columnName === 'sottobrand') {
          console.log(`✅ Trovato '${columnName}' come variante '${variant}'`);
        }
        return row[variant];
      }
    }
    
    if (columnName === 'brand' || columnName === 'sottobrand') {
      console.log(`❌ Non trovato '${columnName}'`);
    }
    return undefined;
  }
  
  /**
   * Mappa i nomi delle colonne Excel ai nomi attesi
   */
  private static mapColumnNames(row: any): ExcelRowData {
    // Possibili varianti dei nomi delle colonne
    const columnMappings = {
      'Linea': ['Linea', 'LINEA', 'linea'],
      'AM Code': ['AM Code', 'AM CODE', 'am code', 'AMCode'],
      'NAM Code': ['NAM Code', 'NAM CODE', 'nam code', 'NAMCode'],
      'Agente CODE': ['Agente CODE', 'Agente COD', 'AGENTE CODE', 'Agente Code', 'Agente'],
      'Insegna Cliente': ['Insegna Cliente', 'Insegna', 'INSEGNA CLIENTE', 'Lev 4'],
             'Codice Cliente': ['Codice Cliente', 'Codice', 'CODICE CLIENTE', 'Sold T', 'Sold To C', 'Sold To Customer Number', 'Customer Number', 'Codice Cliente Number', 'Cliente Number'],
      'Cliente': ['Cliente', 'CLIENTE', 'Sold To Customer', 'Customer'],
    };

    const mappedRow: any = {};
    
    Object.keys(columnMappings).forEach(expectedKey => {
      const possibleNames = columnMappings[expectedKey as keyof typeof columnMappings];
      let found = false;
      
      for (const possibleName of possibleNames) {
        if (row[possibleName] !== undefined) {
          mappedRow[expectedKey] = row[possibleName];
          found = true;
          break;
        }
      }
      
             if (!found) {
         mappedRow[expectedKey] = '';
       }
    });

    return mappedRow as ExcelRowData;
  }

  /**
   * Converte una riga Excel nel formato ExcelRow completo
   */
  static convertExcelRowToCompleteData(row: any, index: number): ExcelRow {
    const mappedRow = this.mapColumnNames(row);
    
    return {
      id: `excel_${index}`,
      linea: mappedRow['Linea'] || '',
      amCode: mappedRow['AM Code'] || '',
      namCode: mappedRow['NAM Code'] || '',
      agenteCode: mappedRow['Agente CODE'] || '',
      agenteName: this.generateAgentName(mappedRow['Agente CODE']),
      insegnaCliente: mappedRow['Insegna Cliente'] || '',
      codiceCliente: mappedRow['Codice Cliente'] || '',
      cliente: mappedRow['Cliente'] || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Converte una riga Excel nel formato AgentImportData
   */
  static convertExcelRowToAgentData(row: any): AgentImportData {
    const mappedRow = this.mapColumnNames(row);
    
         // Fallback per il codice del punto vendita se non disponibile
     const salesPointCode = mappedRow['Codice Cliente'] || 
       (mappedRow['Cliente'] ? `SP_${mappedRow['Cliente'].replace(/[^a-zA-Z0-9]/g, '')}` : 'SP_UNKNOWN');
     
     return {
       name: this.generateAgentName(mappedRow['Agente CODE']),
       code: mappedRow['Agente CODE'] || '',
       salesPointName: mappedRow['Cliente'] || '',
       salesPointCode: salesPointCode,
       region: this.extractRegionFromLine(mappedRow['Linea']),
       province: this.extractProvinceFromLine(mappedRow['Linea']),
       address: '', // Non presente nell'Excel, da compilare manualmente
       phone: '', // Non presente nell'Excel, da compilare manualmente
       email: '', // Non presente nell'Excel, da compilare manualmente
       amCode: mappedRow['AM Code'] || '',
       namCode: mappedRow['NAM Code'] || '',
       line: mappedRow['Linea'] || '',
       level4: mappedRow['Insegna Cliente'] || '',
     };
  }

  /**
   * Genera un nome per l'agente basato sul codice
   */
  private static generateAgentName(agentCode: string): string {
    if (!agentCode) return 'Agente Sconosciuto';
    
    // Mappa codici a nomi (può essere espansa)
    const codeToName: { [key: string]: string } = {
      'MV13': 'Mario Verdi',
      'MM16': 'Marco Moretti',
      // Aggiungi altri mapping qui
    };
    
    return codeToName[agentCode] || `Agente ${agentCode}`;
  }

  /**
   * Estrae la regione dalla linea
   */
  private static extractRegionFromLine(line: string): string {
    if (!line) return 'Regione non specificata';
    
    // Logica per estrarre la regione dalla linea
    // Esempio: "LIV 1 - LINEA 2 - MODERN FOOD" -> "Lombardia"
    if (line.includes('MODERN FOOD')) return 'Lombardia';
    if (line.includes('GRUPPO PAM')) return 'Lazio';
    
    return 'Regione non specificata';
  }

  /**
   * Estrae la provincia dalla linea
   */
  private static extractProvinceFromLine(line: string): string {
    if (!line) return 'Provincia non specificata';
    
    // Logica per estrarre la provincia dalla linea
    if (line.includes('MODERN FOOD')) return 'Milano';
    if (line.includes('GRUPPO PAM')) return 'Roma';
    
    return 'Provincia non specificata';
  }

  /**
   * Converte AgentImportData in User
   */
  static convertToUser(agentData: AgentImportData): User {
    return {
      id: `user_${agentData.code}`,
      name: agentData.name,
      email: agentData.email || `${agentData.code.toLowerCase()}@company.com`,
      role: 'agent',
      salesPointId: `salespoint_${agentData.salesPointCode}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Converte AgentImportData in SalesPoint
   */
  static convertToSalesPoint(agentData: AgentImportData): SalesPoint {
    return {
      id: `salespoint_${agentData.salesPointCode}`,
      name: agentData.salesPointName,
      code: agentData.salesPointCode,
      region: agentData.region,
      province: agentData.province,
      address: agentData.address,
      phone: agentData.phone,
      email: agentData.email || `${agentData.salesPointCode.toLowerCase()}@company.com`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Converte AgentImportData in Agent
   */
  static convertToAgent(agentData: AgentImportData): Agent {
    return {
      id: `agent_${agentData.code}`,
      name: agentData.name,
      code: agentData.code,
      salesPointId: `salespoint_${agentData.salesPointCode}`,
      salesPointName: agentData.salesPointName,
      salesPointCode: agentData.salesPointCode,
      region: agentData.region,
      province: agentData.province,
      address: agentData.address,
      phone: agentData.phone,
      email: agentData.email,
      amCode: agentData.amCode,
      namCode: agentData.namCode,
      line: agentData.line,
      level4: agentData.level4,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Processa il file Excel e restituisce i dati convertiti
   */
  static processExcelFile(fileData: ArrayBuffer): {
    agents: Agent[];
    users: User[];
    salesPoints: SalesPoint[];
    excelRows: ExcelRow[];
    priceReferences: PriceReference[];
  } {
    const workbook = XLSX.read(fileData, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converti in JSON con opzioni specifiche per le intestazioni
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Usa la prima riga come intestazioni
      range: 1   // Inizia dalla seconda riga (la prima è l'intestazione)
    }) as any[];
    
         // Se non ci sono dati, prova senza opzioni
     if (jsonData.length === 0) {
       const fallbackData = XLSX.utils.sheet_to_json(worksheet) as any[];
       if (fallbackData.length > 0) {
         return this.processExcelFileWithData(fallbackData);
       }
     }
     
     // Se abbiamo dati con header:1, converti in formato oggetto
     if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
       const headers = jsonData[0] as string[];
       const dataRows = jsonData.slice(1);
       
       const objectData = dataRows.map(row => {
         const obj: any = {};
         headers.forEach((header, index) => {
           obj[header] = row[index];
         });
         return obj;
       });
       
       return this.processExcelFileWithData(objectData);
     }
     
     // Se arriviamo qui, non abbiamo dati validi
     return { agents: [], users: [], salesPoints: [], excelRows: [], priceReferences: [] };
  }

     /**
    * Processa i dati Excel già convertiti in oggetti
    */
     private static processExcelFileWithData(jsonData: any[]): {
     agents: Agent[];
     users: User[];
     salesPoints: SalesPoint[];
     excelRows: ExcelRow[];
     priceReferences: PriceReference[];
   } {
     console.log('🔍 ExcelImportService: Processamento dati agenti, righe totali:', jsonData.length);
     
     const agents: Agent[] = [];
     const users: User[] = [];
     const salesPoints: SalesPoint[] = [];
     const excelRows: ExcelRow[] = [];
     const priceReferences: PriceReference[] = [];
     const salesPointIds = new Set<string>();

     // Set per tracciare combinazioni uniche di agente + punto vendita
     const uniqueCombinations = new Set<string>();
     
     let processedCount = 0;
     let skippedCount = 0;
     
     jsonData.forEach((row, index) => {
       try {
         // **DEBUG PRIME RIGHE** - Mostra le prime 2 righe per verifica
         if (index < 2) {
           console.log(`🔍 ExcelImportService: Riga ${index + 1}:`, {
             linea: row['Linea'] || row['A'],
             amCode: row['AM Code'] || row['B'],
             namCode: row['NAM Code'] || row['C'],
             agenteCode: row['Agente CODE'] || row['D'],
             lev4: row['Lev 4'] || row['E'],
             soldToC: row['Sold To C'] || row['F'],
             soldToCustomer: row['Sold To Customer'] || row['G'],
             allKeys: Object.keys(row),
             allValues: Object.values(row)
           });
         }
         
         // Crea il record completo Excel con relazioni
         const excelRow = this.convertExcelRowToCompleteData(row, index);
         excelRows.push(excelRow);
         
         const agentData = this.convertExcelRowToAgentData(row);
         
         // Crea una chiave unica per agente + punto vendita
         const uniqueKey = `${agentData.code}_${agentData.salesPointCode}`;
         
         // Evita solo duplicati esatti (stesso agente + stesso punto vendita)
         if (uniqueCombinations.has(uniqueKey)) {
           skippedCount++;
           return;
         }
         uniqueCombinations.add(uniqueKey);

         // Crea SalesPoint se non esiste
         if (!salesPointIds.has(agentData.salesPointCode)) {
           salesPoints.push(this.convertToSalesPoint(agentData));
           salesPointIds.add(agentData.salesPointCode);
         }

         // Crea User e Agent
         users.push(this.convertToUser(agentData));
         agents.push(this.convertToAgent(agentData));
         
         processedCount++;
       } catch (error) {
         console.debug('Ignorato errore singolo:', error);
         skippedCount++;
       }
     });
     
     console.log('📊 ExcelImportService: Righe processate:', processedCount);
     console.log('⚠️ ExcelImportService: Righe saltate:', skippedCount);
     console.log('📊 ExcelImportService: ExcelRows creati:', excelRows.length);

     return { agents, users, salesPoints, excelRows, priceReferences };
   }

   /**
    * Processa file Excel specifico per referenze prezzi
    */
   static processPriceReferencesFile(fileData: ArrayBuffer): PriceReference[] {
     console.log('🔍 ExcelImportService: Inizio processamento file referenze...');
     
     const workbook = XLSX.read(fileData, { type: 'array' });
     const sheetName = workbook.SheetNames[0];
     const worksheet = workbook.Sheets[sheetName];
     
     // Converti in JSON con opzioni specifiche per le intestazioni
     const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
       header: 1, // Usa la prima riga come intestazioni
       range: 1   // Inizia dalla seconda riga (la prima è l'intestazione)
     }) as any[];
     
     // Se non ci sono dati, prova senza opzioni
     if (jsonData.length === 0) {
       const fallbackData = XLSX.utils.sheet_to_json(worksheet) as any[];
       if (fallbackData.length > 0) {
         return this.processPriceReferencesData(fallbackData);
       }
     }
     
     // Se abbiamo dati con header:1, converti in formato oggetto
     if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
       const headers = jsonData[0] as string[];
       const dataRows = jsonData.slice(1);
       
       const objectData = dataRows.map(row => {
         const obj: any = {};
         headers.forEach((header, index) => {
           obj[header] = row[index];
         });
         return obj;
       });
       
       return this.processPriceReferencesData(objectData);
     }
     
     return [];
   }

   /**
    * Processa i dati delle referenze prezzi
    */
   private static processPriceReferencesData(jsonData: any[]): PriceReference[] {
     console.log('🔍 ExcelImportService: Processamento dati referenze, righe totali:', jsonData.length);
     
     // **DEBUG STRUTTURA FILE** - Vediamo le chiavi della prima riga
     if (jsonData.length > 0) {
       console.log('🔍 ExcelImportService: Chiavi disponibili nel file:', Object.keys(jsonData[0]));
       console.log('🔍 ExcelImportService: Prima riga completa:', jsonData[0]);
       
       // **DEBUG DETTAGLIATO** - Testiamo la funzione findColumnValue
       const testRow = jsonData[0];
       console.log('🔍 ExcelImportService: Test findColumnValue:');
       console.log('  - brand:', this.findColumnValue(testRow, 'brand'));
       console.log('  - sottobrand:', this.findColumnValue(testRow, 'sottobrand'));
       console.log('  - tipologia:', this.findColumnValue(testRow, 'tipologia'));
       console.log('  - ean:', this.findColumnValue(testRow, 'ean'));
       console.log('  - cod:', this.findColumnValue(testRow, 'cod'));
       console.log('  - descrizione:', this.findColumnValue(testRow, 'descrizione'));
       console.log('  - pz / crt:', this.findColumnValue(testRow, 'pz / crt'));
       console.log('  - listino unitario 2025:', this.findColumnValue(testRow, 'listino unitario 2025'));
       console.log('  - prezzo netto:', this.findColumnValue(testRow, 'prezzo netto'));
     }
     
     const priceReferences: PriceReference[] = [];
     let processedCount = 0;
     let skippedCount = 0;
     
     jsonData.forEach((row, index) => {
       try {
         // **DEBUG PRIME RIGHE** - Mostra le prime 2 righe per verifica
         if (index < 2) {
           const values = Object.values(row);
           console.log(`🔍 ExcelImportService: Riga referenza ${index + 1}:`, {
             // **DEBUG DETTAGLIATO** - Usa la stessa logica di mappatura corretta
             brand: String(values[3] || ''),
             subBrand: String(values[4] || ''),
             typology: String(values[5] || ''),
             ean: String(values[6] || ''),
             code: String(values[2] || ''),
             description: String(values[7] || ''),
             piecesPerCarton: parseInt(String(values[1] || '0')) || 0,
             unitPrice: parseFloat(String(values[8] || '0').replace(',', '.')) || 0,
             netPrice: parseFloat(String(values[0] || '0').replace(',', '.')) || 0,
             // **DEBUG CHIAVI** - Vediamo esattamente cosa c'è nel file
             allKeys: Object.keys(row),
             allValues: Object.values(row),
             // **DEBUG PRIMI VALORI** - Vediamo i primi valori per capire la struttura
             firstValues: Object.values(row).slice(0, 5)
           });
         }
         
         const reference = this.convertToPriceReference(row, index);
         if (reference) {
           priceReferences.push(reference);
           processedCount++;
         } else {
           skippedCount++;
         }
       } catch (error) {
         console.debug('Ignorato errore referenza:', error);
         skippedCount++;
       }
     });
     
     console.log('📊 ExcelImportService: Referenze processate:', processedCount);
     console.log('⚠️ ExcelImportService: Referenze saltate:', skippedCount);
     console.log('📊 ExcelImportService: Totale referenze create:', priceReferences.length);
     
     return priceReferences;
   }

   /**
    * Converte una riga Excel in PriceReference
    */
   private static convertToPriceReference(row: any, index: number): PriceReference | null {
     try {
       // **DEBUG DETTAGLIATO** - Vediamo cosa contiene ogni riga
       if (index < 3) { // Log solo le prime 3 righe per non intasare
         console.log(`🔍 ExcelImportService: Riga ${index}:`, {
           brand: row['Brand'] || row['A'],
           subBrand: row['Sottobrand'] || row['B'],
           typology: row['Tipologia'] || row['C'],
           ean: row['EAN'] || row['D'],
           code: row['COD.'] || row['E'],
           description: row['Descrizione'] || row['F'],
           piecesPerCarton: row['PZ / CRT'] || row['G'],
           unitPrice: row['listino unitario 2025'] || row['listino unitari o 202'] || row['H'],
           netPrice: row['Prezzo netto'] || row['I'],
          // Log tutte le chiavi disponibili
          allKeys: Object.keys(row),
          // Log tutti i valori per vedere cosa c'è effettivamente
          allValues: Object.values(row),
          // **DEBUG CHIAVI** - Vediamo se ci sono spazi nascosti
          brandKey: `"${row['Brand']}"`,
          typologyKey: `"${row['Tipologia']}"`,
          // **DEBUG DIRETTO** - Proviamo accesso diretto
          directTypology: row['Tipologia'],
          directTypologyType: typeof row['Tipologia'],
          directTypologyLength: row['Tipologia'] ? row['Tipologia'].length : 'undefined'
        });
      }

       // **MAPPATURA CORRETTA** - Usa gli indici corretti basati sui dati reali
       const values = Object.values(row);
       const brand = String(values[3] || '');           // 'Loctite Super Attak'
       const subBrand = String(values[4] || '');        // 'Liquidi'
       const typology = String(values[5] || '');        // 'STD'
       const ean = String(values[6] || '');             // '8000776157658'
       const code = String(values[2] || '');            // '2971871' (COD)
       const description = String(values[7] || '');     // 'LOCTITE Super Attak Original 3g'
       const piecesPerCarton = parseInt(String(values[1] || '0')) || 0;  // '24' (PZ/CRT)
       const unitPrice = parseFloat(String(values[8] || '0').replace(',', '.')) || 0;  // '3.46'
       const netPrice = parseFloat(String(values[0] || '0').replace(',', '.')) || 0;   // '0' (prezzo netto)

      // **DEBUG TIPOLOGIA** - Vediamo perché viene considerata vuota
      if (index < 3) {
        console.log(`🔍 ExcelImportService: Tipologia riga ${index}:`, {
          typology,
          typologyTrimmed: typology.trim(),
          isEmpty: !typology || typology.trim() === '',
          typologyType: typeof typology
        });
      }

      // **LOGICA MIGLIORATA** - Gestisce meglio le righe con tipologia vuota
      // Se la tipologia è vuota ma abbiamo altri dati validi, usiamo un valore di default
      const finalTypology = (!typology || typology.trim() === '') ? 'STD' : typology.trim();
      
      // **CRITERIO MIGLIORATO** - Accetta righe se hanno almeno brand e descrizione
      const hasValidData = brand && description && ean;
      if (!hasValidData) {
        if (index < 3) {
          console.log(`⚠️ ExcelImportService: Riga ${index} saltata - dati insufficienti`);
        }
        return null;
      }

       return {
         id: `ref_${Date.now()}_${index}`,
         brand: brand.toString().trim(),
         subBrand: subBrand.toString().trim(),
         typology: finalTypology, // Usa la tipologia gestita
         ean: ean.toString().trim(),
         code: code.toString().trim(),
         description: description.toString().trim(),
         piecesPerCarton,
         unitPrice,
         netPrice,
         isActive: false, // Di default non attivo
         createdAt: new Date(),
         updatedAt: new Date(),
       };
     } catch (error) {
       console.debug('Errore conversione referenza:', error);
       return null;
     }
   }
 } 