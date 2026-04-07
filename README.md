# Pārbaudes darbu plānošanas sistēma

**Projekta dokumentācija**

---

## 📋 Satura rādītājs

1. [Problēmas izpēte un analīze](#1-problēmas-izpēte-un-analīze)
2. [Programmatūras prasību specifikācija](#2-programmatūras-prasību-specifikācija)
3. [Programmatūras izstrādes plāns](#3-programmatūras-izstrādes-plāns)
4. [Atkļūdošanas un akcepttestēšanas pārskats](#4-atkļūdošanas-un-akcepttestēšanas-pārskats)
5. [Lietotāja ceļvedis](#5-lietotāja-ceļvedis)
6. [Licence](#6-licence)
7. [Programmatūras kods un labā prakse](#7-programmatūras-kods-un-labā-prakse)
8. [Pielikumi](#pielikumi)

---

## 1. Problēmas izpēte un analīze

### 1.1 Izpētes metodes izvēle un pamatojums

Projekta izstrādes sākumposmā tika izvēlētas divas pētniecības metodes: dokumentu izpēte un dienasgrāmatu studija.

#### Tika izmantotas šādas metodes:

- **Dokumentu izpēte** — Tika analizēti esošie plānošanas rīki: administrācijas sūtītās Excel tabulas (gada plāni) un sistēma "E-klase". Šī metode ļauj identificēt nepilnības pašreizējā datu pasniegšanas struktūrā un vizualizācijā.

- **Dienasgrāmatu studija** — Tika pētīta informācijas aprite no skolotāja līdz skolēnam, analizējot, cik savlaicīgi un saprotami dati parādās skolēna pārskatā.

### 1.2 Izpētes procesa apraksts

Izpētes laikā tika konstatētas vairākas kritiskas problēmas, kas kavē efektīvu mācību procesa plānošanu:

1. **Skolēniem izsūtītās Excel tabulas** — Kurās apkopoti visi mācību gada pārbaudes darbi, ir ārkārtīgi neparocīgas un nepārskatāmas. Tās bieži satur simtiem rindu, ir grūti lasāmas mobilajās ierīcēs, un informācijas meklēšana konkrētai klasei prasa pārmērīgu laiku.

2. **Daudzos mācību priekšmetos gada plāni nav aizpildīti** — Vai arī norādītie laiki ir pārāk aptuveni (piemēram, "novembris"), kas neļauj skolēnam plānot savu laiku.

3. **E-klase nesniedz savlaicīgu informāciju** — Lai gan E-klase kalpo kā oficiālais žurnāls, tajā darbi bieži parādās tikai dažas dienas pirms to norises.

### 1.3 Izpētes datu apkopojums

Pētījuma rezultāti norāda uz šādiem secinājumiem:

- **99% skolēnu** atzīst, ka gada Excel plānus praktiski neizmanto to sarežģītā formāta dēļ.

- **Vairāk nekā puse pārbaudes darbu** tiek izziņoti pēdējā brīdī, radot nevajadzīgu stresu.

- **Nepieciešama centralizēta sistēma**, kas aizstātu statiskās tabulas ar dinamiskām, filtrējamām saraksta formām, nodrošinot vienotu informācijas avotu gan skolotājiem, gan skolēniem.


---

## 2. Programmatūras prasību specifikācija

### 2.1 Risinājuma mērķauditorijas izvēle un tās raksturojums

Sistēma ir izstrādāta trim galvenajām lietotāju grupām:

| Lietotāju grupa | Apraksts |
|---|---|
| **Administrators** | Atbild par sistēmas pamata datu uzturēšanu. Veido lietotāju kontus, piešķir lomas, pārvalda klašu un mācību priekšmetu sarakstus. Administratoram ir piekļuve paroles atiestatīšanas funkcijai. |
| **Skolotājs** | Sistēmas satura veidotājs. Galvenā funkcija ir pievienot, rediģēt un dzēst informāciju par pārbaudes darbiem, norādot tēmu, aprakstu, datumu un vērtējuma svaru. |
| **Skolēns** | Galvenais informācijas patērētājs. Sistēma ļauj skatīt tikai savai klasei aktuālos darbus, izmantojot ērtus filtrus, lai atlasītu gaidāmos vai pagātnes darbus. |

### 2.2 Programmatūras produkta un tā funkciju apraksts

#### Tehnoloģijas un arhitektūra

Izstrādātais pieteikums ir tīmekļa lietotne, kas bāzēta uz:

- **Backend**: Node.js
- **Datenubāze**: SQLite

Šī kombinācija nodrošina augstu datu apstrādes ātrumu un uzticamību.

#### Galvenie drošības risinājumi

- **Autorizācija** — Unikāli lietotājvārdi un paroles
- **Piekļuves kontrole (RBAC)** — Lomu bāzēta piekļuves kontrole, kas liedz skolēniem veikt jebkādas izmaiņas informācijā
- **Datu integritāte** — Garantēta datu konsekvence un drošība

#### Galvenās funkcionalitātes

**Dinamiska filtrēšana** — Izmantojot mūsdienīgo JavaScript fetch API, lietotāji var ērti atlasīt un filtrēt datus:
- Pēc klases
- Pēc mācību priekšmeta
- Pēc mēneša
- Bez pilnās lapas pārlādes

**Automātiskā darbu organizācija** — Visi pārbaudes darbi tiek automātiski grupēti sekcijās:
- "Gaidāmie" — darbi, kas vēl notiks
- "Iepriekšējie" — jau notikušie darbi
- "Bez datuma" — darbi ar aptuvenu izpildes periodu

**Teksta formatēšana** — Skolotājiem ir pieejama vizuālā rīkjosla ar opcijām:
- Treknraksts
- Kursīvs
- Saraksti
- Citi formatēšanas varianti

**Drukāšanas iespēja** — Visiem lietotājiem nodrošināta iespēja ģenerēt tīru, drukāšanai optimizētu pārbaudes darbu saraksta skatu.

### 2.3 Programmatūras produkta skice

| Attēls | Apraksts |
|---|---|
| ![1. attēls](https://github.com/user-attachments/assets/c211fae8-829e-4dbe-8e9b-d7d6672cbe9b) | Pieslēgšanās logs: Minimālistisks dizains ar kļūdu paziņojumu apstrādi. |
| ![2. attēls](https://github.com/user-attachments/assets/94aabdba-a978-4583-920b-6103e85d9561) | Skolotāja darba galds: Tabula ar vadības pogām (Pievienot, Rediģēt, Dzēst, Skatīt). |
| ![3. attēls](https://github.com/user-attachments/assets/e8a41f73-6bb9-4133-bace-a97590122a6b) | Administratora skats: Iespēja pārvaldīt lietotājus, klases un priekšmetus. |
| ![4. attēls](https://github.com/user-attachments/assets/ecb93f7b-aaf4-4fb6-945e-d71299916123) | Skolēna skats: Akordeona tipa izvēlne, kas paslēpj vai parāda dažādu laika posmu darbus, novēršot informācijas pārblīvētību. |


---

## 3. Programmatūras izstrādes plāns

### 3.1 Plānošana un arhitektūras projektēšana

Izstrādes sākumposmā galvenā uzmanība tika pievērsta sistēmas arhitektūras definēšanai un datu modeļa izveidei.

**Veiktie darbi:**

- Tika definētas četras galvenās sistēmas entītijas:
  - Lietotāji (skolēni, skolotāji, administratori)
  - Mācību klases
  - Mācību priekšmeti
  - Pārbaudes darbi

  Katrai entītijai tika noteikti nepieciešamie atribūti (piemēram, pārbaudes darbam: nosaukums, apraksts, datums, svars).

- Izmantojot SQLite, tika izveidota relāciju datu bāzes shēma. Tika definētas primārās un ārējās atslēgas (Primary/Foreign Keys), lai nodrošinātu datu integritāti. Ieviesta relācija "viens pret daudziem" starp klases un lietotāja tabulām, un starp lietotāja (skolotāja) un pārbaudes darbu tabulām.

### 3.2 Servera puses (Backend) izstrāde

Šajā posmā tika izveidota sistēmas loģika, izmantojot Node.js vidi.

**Implementēto risinājumu apskats:**

- **Maršrutēšana un datu bāze** — Izmantots Express.js maršrutēšanai un SQLite3 tiešai mijiedarbībai ar datu bāzi
- **Drošība** — Integrēta Bcrypt bibliotēka lietotāju paroļu jaukšanai (hashing) pirms saglabāšanas
- **API galapunkti** — Izstrādāti vairāki endpoints datu saņemšanai, pievienošanai, rediģēšanai un dzēšanai
- **Piekļuves kontrole (RBAC)** — Ieviesta lomu bāzēta piekļuves kontrole ar middleware, kas nodrošina, ka tikai skolotāji var veikt izmaiņas

### 3.3 Klienta puses (Frontend) izstrāde

Lietotāja saskarne tika veidota ar fokusu uz intuitīvu lietojamību un atsaucīgu dizainu.

**Dizaina risinājumi:**

- **HTML5 un CSS3** — Izstrādātas trīs galvenās lietotāju darba vides
- **Bootstrap karkass** — Paātrināja dizaina izstrādi un nodrošināja vizuālo konsistenci
- **Asinhronā datu apmaiņa** — Izmantots moderno JavaScript Fetch API, ļaujot lietotājiem filtrēt datus bez lapas pārlādes

### 3.4 Testēšana, atkļūdošana un optimizācija

Pirms sistēmas izmantošanas tika veikta rūpīga pārbaude.

**Testēšanas procesi:**

- Pārbaudītas visas pamatfunkcijas: pieslēgšanās, jauna darba izveide, datu filtrēšana un paroļu maiņa
- Katrs API galapunkts testēts ar dažādiem datu ievades scenārijiem
- Simulēti mēģinājumi piekļūt aizliegtām sadaļām bez autorizācijas, nodrošinot drošu bloķēšanu
- Pārbaudīta saskarnes darbība uz dažāda izmēra ekrāniem, lai nodrošinātu ērtību mobilajās ierīcēs


---

## 4. Atkļūdošanas un akcepttestēšanas pārskats

### 4.1 Atkļūdošanas process

Izstrādes laikā tika identificētas un novērstas vairākas tehniskas kļūdas:

- **Datu ielādes problēmas** — Sākotnēji radās kļūdas, ja serveris neatbildēja pietiekami ātri. Tika ieviesti try-catch bloki un vizuāli kļūdu paziņojumi lietotājam, izmantojot showError funkciju.

- **Modālā loga fona problēma** — Novērsta kļūda, kurā pēc modālā loga aizvēršanas fona aizsegs (modal-backdrop) palika aktīvs, neļaujot turpināt darbu ar lapu.

- **Datumu formatēšana** — Standartizēta datumu attēlošana starp datu bāzi (ISO formāts) un lietotāja saskarni (Latvijas standarta formāts dd.mm.yyyy).

### 4.2 Akcepttestēšanas rezultāti

| # | Testa gadījums | Veiktās darbības | Paredzamais rezultāts | Rezultāts |
|:---:|---|---|---|:---:|
| 1 | Autorizācijas process | Lietotājs ievada reģistrētu lietotājvārdu un paroli | Sistēma autentificē lietotāju un pārvirza uz attiecīgo paneli (Admin/Teacher/Student) | ✓ |
| 2 | Lomu validācija | Skolēns mēģina manuāli pāriet uz adresi /teacher | Pateicoties requireRole vidusslānim, piekļuve tiek liegta un lietotājs paliek savā saskarnē | ✓ |
| 3 | Darba pievienošana | Skolotājs aizpilda formu ar visiem nepieciešamajiem laukiem | Ieraksts tiek veiksmīgi izveidots un parādās "Gaidāmie" sarakstā | ✓ |
| 4 | Vizuālā redaktora darbība | Skolotājs izmanto rīkjoslu (Bold, Italic, List), lai noformētu aprakstu | Apraksts tiek saglabāts ar HTML tagiem un korekti attēlots skatīšanās logā | ✓ |
| 5 | Dinamiskā filtrēšana (Klase) | Lietotājs izvēlas filtru "12.A klase" | Tabulā tiek parādīti tikai tie darbi, kas piesaistīti konkrētajai klasei bez lapas pārlādes | ✓ |
| 6 | Dinamiskā filtrēšana (Mēnesis) | Lietutājs izvēlas konkrētu mēnesi (piem., "Septembris") | Sistēma atlasa darbus, kuru date_exact atbilst izvēlētajam mēnesim | ✓ |
| 7 | Darba rediģēšana | Skolotājs atver darbu, maina datus un saglabā | Datu bāzē informācija tiek atjaunota (izmantojot PUT pieprasījumu) | ✓ |
| 8 | Darba dzēšana | Skolotājs nospiež "Dzēst" un apstiprina izvēli | Ieraksts tiek izdzēsts no datu bāzes un pazūd no lietotāja saskarnes | ✓ |
| 9 | Bez datuma darbu apstrāde | Tiek pievienots darbs bez konkrēta datuma, norādot tikai periodu | Darbs automātiski tiek ierindots sekcijā "Bez datuma" | ✓ |
| 10 | Eksports un druka | Lietotājs nospiež pogu "Eksportēt PDF" | Atveras jauns logs ar optimizētu tabulas skatu drukāšanai | ✓ |
| 11 | Paroles maiņa | Lietotājs profilā ievada jaunu paroli un saglabā | Parole tiek veiksmīgi nomainīta; datu bāzē tiek saglabāts jauns bcrypt jaucējkods | ✓ |
| 12 | Atslēgšanās (Logout) | Lietotājs nospiež pogu "Iziet" | Sesija tiek iznīcināta un lietotājs tiek pārvirzīts uz /login lapu | ✓ |
| 13 | Lietotāju pārvaldība | Administrators pievieno jaunu skolotāju | Jaunais skolotājs var pieslēgties un sākt darbu ar sistēmu | ✓ |
| 14 | Kļūdu apstrāde | Mēģinājums saglabāt darbu ar tukšiem obligātajiem laukiem | Sistēma rāda paziņojumu (Toast) par nepieciešamību aizpildīt laukus | ✓ |


---

## 5. Lietotāja ceļvedis

### 5.1 Vispārīgā uzsākšana

Lai uzsāktu darbu ar sistēmu, lietotājam pārlūkprogrammas adreses joslā jāievada sistēmas lokālā vai tīmekļa adrese.

- **Autorizācija** — Atvērtajā logā ievadiet savu piešķirto lietotājvārdu un paroli

- **Pieslēgšanās** — Nospiediet pogu "Pieslēgties". Sistēma automātiski atpazīs jūsu lomu un novirzīs uz attiecīgo darba vidi

- **Paroles maiņa** — Drošības nolūkos pēc pirmās pieteikšanās ieteicams nomainīt paroli

### 5.2 Ceļvedis skolēniem

Skolēna darba vide ir optimizēta ātrai informācijas ieguvei par plānotajiem pārbaudes darbiem.

**Filtru izmantošana:**
- Lapas augšpusē ir pieejami filtri "Mācību priekšmets" un "Mēnesis"
- Izvēloties konkrētus parametrus, saraksts automātiski ielādēs tikai tos darbus, kas atbilst atlasei

**Darbu pārskatīšana — Pārbaudes darbi ir sagrupēti sekcijās:**
- **Gaidāmie** — Darbi, kas vēl tikai notiks
- **Iepriekšējie** — Arhīvs ar jau notikušajiem darbiem
- **Bez datuma** — Darbi ar aptuvenu termiņu

**Detalizēta informācija** — Nospiežot pogu "Skatīt" pie konkrēta darba, atvērsies modālais logs ar pilnu aprakstu un vērtējuma svaru

**Saraksta drukāšana** — Izmantojiet pogu "Eksportēt PDF", lai sagatavotu sarakstu drukāšanai vai saglabāšanai

### 5.3 Ceļvedis skolotājiem

Skolotājiem ir tiesības pārvaldīt savu mācību priekšmetu saturu.

**Jauna darba pievienošana:**
1. Nospiediet zaļo pogu "Pievienot jaunu"
2. Formas logā izvēlieties klasi un mācību priekšmetu
3. Ievadiet nosaukumu un izmantojiet vizuālo rīkjoslu formatēšanai
4. Norādiet precīzu datumu vai atstājiet lauku tukšu
5. Saglabājiet ierakstu

**Rediģēšana un dzēšana:**
- "Rediģēt" — Ļauj veikt izmaiņas esošā darbā
- "Dzēst" — Pilnībā izņem ierakstu no sistēmas

### 5.4 Ceļvedis administratoriem

Administrators nodrošina sistēmas tehnisko bāzi.

- **Lietotāju pārvaldība** — Izveidot jaunus kontus, piešķirt lomas un piesaistīt skolēnus klasēm

- **Sistēmas sarakstu uzturēšana** — Pievienot jaunas klases un mācību priekšmetus

- **Drošības audits** — Veikt lietotāju paroļu atiestatīšanu pēc nepieciešamības


---

## 6. Licence

### 6.1 Licences izvēles pamatojums

MIT licence ir viena no populārākajām un atvērtākajām brīvprogrammatūras licencēm pasaulē. Tās izmantošana šajā projektā ir pamatota ar šādiem punktiem:

- **Akadēmiskā brīvība** — Tā kā šis ir mācību projekts, MIT licence ļauj citiem skolēniem vai izglītības iestādēm brīvi pētīt kodu, mācīties no tā un to modificēt bez stingriem juridiskiem ierobežojumiem.

- **Vienkāršība** — Atšķirībā no sarežģītākām licencēm (piemēram, GPL), MIT licence ir īsa un viegli saprotama, kas ir būtiski skolas vidē.

- **Savietojamība** — Šī licence ir saderīga ar daudzām bibliotēkām, kas izmantotas projektā (piemēram, Express.js un SQLite3), tādējādi neradot juridiskus konfliktus.

### 6.2 Licences nosacījumi

Piemērojot MIT licenci, tiek noteikti šādi noteikumi:

- **Atļaujas** — Jebkurai personai tiek piešķirtas tiesības bez maksas izmantot, kopēt, modificēt, apvienot, publicēt un izplatīt šīs programmatūras kopijas.

- **Pienākumi** — Vienīgais nosacījums ir saglabāt oriģinālo autortiesību paziņojumu un šo licences tekstu visās programmatūras kopijās vai būtiskās tās daļās.

- **Atbildības ierobežojums** — Programmatūra tiek piegādāta "tāda, kāda tā ir", bez jebkāda veida garantijām. Autors nenes atbildību par jebkādām prasībām, zaudējumiem vai citām saistībām.

### 6.3 Ietekme uz projekta nākotni

Izvēloties MIT licenci, tiek veicināta atvērtā koda kultūra izglītības iestādē:

- Citi izstrādātāji var pievienot jaunas funkcijas neriskējot pārkāpt autortiesības.

- Sistēmu var adaptēt dažādām skolām, mainot vizuālo noformējumu vai datu bāzes struktūru.

- Projekts var kalpot par pamatu plašākai skolas vadības sistēmas izstrādei nākotnē.


---

## 7. Programmatūras kods un labā prakse

### 7.1 Strukturētība un modularitāte

Kods nav veidots kā viens monolīts fails, bet gan sadalīts loģiskos moduļos, kas atvieglo tā uzturēšanu un paplašināšanu:

- **Backend loģika** — Servera puse ir nodalīta no datu bāzes operācijām. Datu bāzes inicializācija un vaicājumi ir izdalīti atsevišķā modulī (db.js), nodrošinot vienotu saskarni.

- **Frontend modularitāte** — Katrai lietotāja lomei (skolēnam, skolotājam, administratoram) ir savs JavaScript fails ar tikai šai lomai specifisko funkciju loģiku.

- **Statiskie resursi** — CSS stili un kopējie JavaScript rīki ir izdalīti atsevišķās mapēs, nodrošinot tīru projekta struktūru.

### 7.2 Programmēšanas labās prakses principi

Projekta izstrādē tika pielietoti šādi principi:

- **Jēgpilni nosaukumi** — Mainīgo, funkciju un klašu nosaukumi ir pašaprakstoši (piemēram, fetchAssessments(), currentUserRole, isPasswordValid), kas ļauj citam izstrādātājam viegli saprast koda darbību.

- **Komentēšana** — Sarežģītākās koda daļas, piemēram, API maršrutu vidusslāņi (middleware) un asinhronās funkcijas, ir papildinātas ar komentāriem, paskaidrojot to mērķi.

- **Kodu atkārtota izmantošana (DRY)** — Kopējās darbības kā kļūdu ziņojumu attēlošana vai datu sūtīšana uz serveri ir apvienotas universālās funkcijās.

### 7.3 Drošības risinājumi

Drošība ir viena no sistēmas prioritātēm:

- **Paroļu drošība** — Sistēma nekad neglabā lietotāju paroles atklātā veidā. Tiek izmantota bcrypt bibliotēka, kas pārvērš paroles neatšifrējamos jaucējkodos.

- **Autorizācijas pārbaude** — Katrs pieprasījums serverim tiek pārbaudīts, izmantojot sesiju vadību. Ja lietotājam nav atbilstošu tiesību, serveris bloķē piekļuvi.

- **Datu validācija** — Pirms saglabāšanas datu bāzē visi lietotāja ievadītie dati tiek pārbaudīti, lai novērstu kļūdainu vai kaitniecisku datu ievadi.

### 7.4 Lietotāja saskarnes (UI/UX) principi

Saskarne tika veidota, ievērojot lietojamības pamatprincipus:

- **Atsaucīgs dizains** — Izmantojot Bootstrap karkasu, sistēma ir ērti lietojama gan uz datoriem, gan planšetdatoriem un viedtālruņiem.

- **Atgriezeniskā saite** — Veicot jebkuru darbību (saglabāšanu, dzēšanu vai kļūdu), lietotājs saņem skaidru vizuālu apstiprinājumu caur Toast paziņojumiem vai modālajiem lokiem.

---

## 📚 Literatūras saraksts

1. *Pārbaudes darbu plānotājs*. E-klase. 1 lpp.

2. *Learn to Code* [tiešsaiste]. W3Schools [skatīts 2026. gada 14. martā]. Pieejams: https://www.w3schools.com/

3. *Run JavaScript Everywhere* [tiešsaiste]. Node.js [skatīts 2026. gada 14. martā]. Pieejams: https://nodejs.org/en

4. *SQLite* [tiešsaiste]. SQLite [skatīts 2026. gada 14. martā]. Pieejams: https://sqlite.org/

5. *Vērtēšanas plāns 11. klasē 2024./2025. m.g.* (2024). J.Pilsudska Daugavpils valsts poļu ģimnāzija. 12 lpp.

6. *Vērtēšanas plāns 12. klasē 2025./2026. m.g.* (2025). J.Pilsudska Daugavpils valsts poļu ģimnāzija. 27 lpp.

---

## Pielikumi

### 1. pielikums — Datubāzes struktūra

![Datubāzes struktūra](https://github.com/user-attachments/assets/9fc4d029-109a-4ca4-91e0-a072e11692b9)

### 2. pielikums — Pārbaudes darbu plānošanas sistēmas failu struktūra

![Failu struktūra](https://github.com/user-attachments/assets/ee3e9133-3fcb-452d-b639-22c162acb40b)

---

**Dokumentācija pabeigta** — 2026. gada 7. aprīlī 23:04 UTC+3
