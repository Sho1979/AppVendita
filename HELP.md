# 🆘 HELP - Guida di Soccorso AppVendita

## 🛡️ Punto di Backup Sicuro

**Commit di backup stabile:** `166abe3` - "Initial commit: AppVendita React Native project with enhanced architecture"

Questo è il nostro **punto zero** sicuro che contiene:
- ✅ Architettura Clean Architecture completa
- ✅ Configurazione React Native corretta
- ✅ Tutti i componenti UI e servizi
- ✅ Documentazione completa
- ✅ Configurazione Firebase

---

## 🔄 Modalità di Recupero Backup

### 1. **Ripristino Completo al Punto Sicuro**
```bash
# ATTENZIONE: Questo cancella tutte le modifiche non committate!
git reset --hard 166abe3
```

### 2. **Creare Branch di Backup**
```bash
# Crea un branch di backup senza perdere modifiche correnti
git checkout -b backup-stable 166abe3
```

### 3. **Ripristino Selettivo di File**
```bash
# Ripristina solo un file specifico
git checkout 166abe3 -- path/to/file.tsx

# Ripristina tutti i file di una cartella
git checkout 166abe3 -- src/presentation/components/
```

### 4. **Confronto con il Backup**
```bash
# Vedi le differenze con il punto sicuro
git diff 166abe3

# Vedi le differenze per un file specifico
git diff 166abe3 -- src/presentation/components/TooltipModal.tsx
```

---

## 🚀 Best Practices per lo Sviluppo

### **Workflow Sicuro**
```bash
# 1. Crea branch per nuove feature
git checkout -b feature/nome-feature

# 2. Sviluppa e committa frequentemente
git add .
git commit -m "feat: descrizione della modifica"

# 3. Testa prima del merge
npm test
# oppure
yarn test

# 4. Merge nel master
git checkout master
git merge feature/nome-feature

# 5. Push su GitHub
git push origin master
```

### **Commit Frequenti e Descritivi**
```bash
# Esempi di messaggi di commit
git commit -m "feat: aggiunto tooltip con colori pastello"
git commit -m "fix: risolto problema import Excel"
git commit -m "refactor: migliorata architettura CalendarContext"
git commit -m "docs: aggiornata documentazione API"
```

---

## 🏷️ Gestione Versioni

### **Tag per Milestone Importanti**
```bash
# Crea tag per versioni stabili
git tag v1.0.0 -m "Prima versione stabile"
git tag v1.1.0 -m "Aggiunta gestione calendario"
git push origin --tags
```

### **Lista Tag Disponibili**
```bash
# Vedi tutti i tag
git tag -l

# Vedi dettagli di un tag
git show v1.0.0
```

---

## 🔍 Comandi di Diagnostica

### **Stato del Repository**
```bash
# Stato generale
git status

# Storico commit
git log --oneline

# Branch attuali
git branch -a

# Remote configurati
git remote -v
```

### **Analisi Modifiche**
```bash
# Vedi modifiche non committate
git diff

# Vedi modifiche nell'area di staging
git diff --cached

# Storico modifiche per file
git log --follow -- path/to/file.tsx
```

---

## 🚨 Situazioni di Emergenza

### **Modifiche Non Committate da Salvare**
```bash
# Salva modifiche in stash
git stash push -m "backup modifiche emergenza"

# Ripristina modifiche salvate
git stash pop

# Lista stash disponibili
git stash list
```

### **Reset Completo (ESTREMO)**
```bash
# ATTENZIONE: Cancella TUTTO e torna al backup
git reset --hard 166abe3
git clean -fd
```

### **Recupero File Cancellati**
```bash
# Vedi file cancellati
git log --diff-filter=D --summary

# Ripristina file specifico
git checkout HEAD~1 -- path/to/deleted/file.tsx
```

---

## 📋 Checklist Pre-Commit

Prima di ogni commit, verifica:

- [ ] **Codice compila** senza errori
- [ ] **Test passano** (se presenti)
- [ ] **Linter non segnala errori**
- [ ] **Messaggio commit è descrittivo**
- [ ] **Non ci sono file temporanei** (.tmp, .log)
- [ ] **Credenziali non sono esposte** (.env)

---

## 🔗 Link Utili

- **Repository GitHub:** https://github.com/Sho1979/AppVendita
- **Commit di Backup:** `166abe3`
- **Documentazione Architettura:** `ARCHITECTURE.md`
- **Obiettivi Progetto:** `OBIETTIVI.md`

---

## 📞 Comandi Rapidi

```bash
# Backup veloce
git stash push -m "backup $(date)"

# Stato veloce
git status --short

# Commit veloce (solo file tracciati)
git commit -am "quick fix"

# Push veloce
git push origin master
```

---

**💡 Ricorda:** Il commit `166abe3` è il tuo salvavita. Usalo sempre come punto di riferimento sicuro! 🛡️ 