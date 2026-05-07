# Database and Software Change Documentation

## Nederlands

### Doel van deze documentatie

Deze documentatie beschrijft hoe wijzigingen aan de database en aan de software op een gecontroleerde manier kunnen worden uitgevoerd. Het doel is om ervoor te zorgen dat databasewijzigingen, applicatiecode en Prisma altijd met elkaar overeenkomen.

Gebruik deze documentatie wanneer je:

- een tabel wilt toevoegen, wijzigen of verwijderen;
- een kolom wilt toevoegen, wijzigen of verwijderen;
- relaties, indexes of constraints wilt aanpassen;
- bestaande data wilt corrigeren of migreren;
- de applicatie moet aanpassen aan een gewijzigde database;
- Prisma opnieuw moet synchroniseren met de database;
- lokaal de MariaDB-database wilt starten of testen.

### Belangrijke bestanden

Deze map bevat de databaseconfiguratie en SQL-bestanden voor de lokale MariaDB-omgeving.

| Bestand | Doel |
| --- | --- |
| `compose.yaml` | Start een lokale MariaDB-container met Docker Compose. |
| `init.sql` | Initialiseert de database wanneer de MariaDB-container voor het eerst wordt aangemaakt. |
| `alter.sql` | Bevat SQL-wijzigingen die op een bestaande database kunnen worden uitgevoerd. |
| `db to prisma on local.sql` | Bevat lokale database-rechten en de Prisma-sync instructie. |
| `db-start.sh` | Script om de databaseomgeving op te starten, indien gebruikt in de lokale workflow. |

### Verschil tussen `init.sql` en `alter.sql`

`init.sql` wordt gebruikt bij een nieuwe database. Dit bestand wordt door Docker uitgevoerd wanneer de MariaDB-container voor het eerst wordt aangemaakt en de database nog leeg is.

`alter.sql` wordt gebruikt voor een bestaande database. Hierin plaats je wijzigingen die toegepast moeten worden zonder de volledige database opnieuw aan te maken.

Praktische regel:

- Nieuwe installatie nodig? Zorg dat `init.sql` correct is.
- Bestaande database bijwerken? Voeg de wijziging toe aan `alter.sql`.
- Wil je dat nieuwe en bestaande databases dezelfde structuur krijgen? Pas beide bestanden aan.

### Lokale database starten

Start de lokale MariaDB-database met:

```bash
docker compose up -d
```

De standaardconfiguratie uit `compose.yaml`:

| Instelling | Waarde |
| --- | --- |
| Database | `app_db` |
| Gebruiker | `app_user` |
| Wachtwoord | `app_password` |
| Root wachtwoord | `rootpassword` |
| Poort | `3306` |
| Containernaam | `local-mariadb` |

Controleer of de container draait:

```bash
docker ps
```

### Wanneer is een databasewijziging nodig?

Een databasewijziging is nodig wanneer de structuur of inhoud van de database verandert. Voorbeelden:

- een nieuwe tabel toevoegen;
- een bestaande tabel uitbreiden met een kolom;
- een kolom hernoemen of van datatype veranderen;
- een relatie tussen tabellen toevoegen;
- een index toevoegen voor betere prestaties;
- verplichte velden toevoegen via `NOT NULL`;
- bestaande records corrigeren;
- oude tabellen of kolommen verwijderen.

### Werkwijze voor databasewijzigingen

Volg bij voorkeur deze stappen:

1. Beschrijf eerst wat er moet veranderen.
2. Controleer welke tabellen, kolommen en relaties geraakt worden.
3. Bepaal of de wijziging alleen lokaal is of ook nodig is voor andere omgevingen.
4. Schrijf de SQL-wijziging in `alter.sql`.
5. Pas `init.sql` aan wanneer nieuwe databases dezelfde structuur moeten krijgen.
6. Test de SQL lokaal.
7. Controleer of bestaande data behouden blijft.
8. Synchroniseer Prisma als de software de gewijzigde tabellen gebruikt.
9. Pas de applicatiecode aan.
10. Test de volledige flow in de applicatie.

### Voorbeeld: een kolom toevoegen

Stel dat er een extra veld `phone_number` nodig is op een bestaande tabel `users`.

Voor een bestaande database voeg je dit toe aan `alter.sql`:

```sql
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(30) NULL;
```

Daarna pas je ook de definitie van `users` in `init.sql` aan, zodat nieuwe lokale databases deze kolom meteen hebben.

Gebruik eerst `NULL` als bestaande records nog geen waarde hebben. Maak een kolom pas `NOT NULL` wanneer je zeker weet dat bestaande data een geldige waarde heeft of wanneer je een defaultwaarde voorziet.

### Voorbeeld: een tabel toevoegen

Nieuwe tabellen horen in `init.sql`, maar voor bestaande databases moet dezelfde tabel ook via `alter.sql` worden aangemaakt.

Voorbeeld in `alter.sql`:

```sql
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Let erop dat relaties met andere tabellen pas toegevoegd worden wanneer de betrokken tabellen bestaan.

### Voorbeeld: bestaande data migreren

Soms is niet alleen de structuur belangrijk, maar ook de bestaande data.

Voorbeeld:

```sql
UPDATE users
SET status = 'active'
WHERE status IS NULL;
```

Test datawijzigingen altijd eerst lokaal. Gebruik bij voorkeur een `WHERE`-clausule zodat niet per ongeluk alle records worden aangepast.

### Veilig omgaan met destructieve wijzigingen

Wees extra voorzichtig met:

- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- `DELETE` zonder duidelijke `WHERE`
- `UPDATE` zonder duidelijke `WHERE`
- wijzigingen aan primary keys of foreign keys
- wijzigingen aan datatypes met bestaande data

Aanbevolen aanpak:

1. Maak eerst een backup of export.
2. Controleer hoeveel records geraakt worden.
3. Test de wijziging lokaal.
4. Documenteer waarom de destructieve wijziging nodig is.
5. Voer de wijziging pas uit wanneer duidelijk is dat de applicatie hierop aangepast is.

### Softwarewijzigingen na databasewijzigingen

Wanneer de database verandert, moet de software vaak ook aangepast worden. Denk aan:

- formulieren waar nieuwe velden ingevuld worden;
- tabellen of detailpagina's waar nieuwe data getoond wordt;
- API-routes die data ophalen of opslaan;
- validatie van verplichte velden;
- Prisma-modellen;
- TypeScript-types;
- seed- of testdata;
- rapporten of exports.

### Prisma synchroniseren

Wanneer Prisma gebruikt wordt, moet het Prisma schema overeenkomen met de database.

Voer in het softwareproject uit:

```bash
pnpm prisma db pull
```

Deze stap leest de bestaande database en werkt het Prisma schema bij.

Daarna controleer je:

- of nieuwe tabellen zichtbaar zijn;
- of nieuwe kolommen correct zijn toegevoegd;
- of datatypes logisch zijn;
- of relaties correct herkend zijn;
- of oude velden niet per ongeluk verdwenen zijn.

Afhankelijk van het project kan het daarna nodig zijn om Prisma Client opnieuw te genereren:

```bash
pnpm prisma generate
```

### Werkwijze voor softwarewijzigingen

Volg deze stappen wanneer de applicatie aangepast moet worden:

1. Zorg dat de databasewijziging lokaal werkt.
2. Synchroniseer Prisma indien van toepassing.
3. Zoek in de applicatiecode waar de betrokken tabel of kolom gebruikt wordt.
4. Pas queries, services, API-routes of server actions aan.
5. Pas formulieren, schermen en validatie aan.
6. Controleer of TypeScript-fouten opgelost zijn.
7. Test de volledige gebruikersflow.
8. Controleer of bestaande functionaliteit nog werkt.

### Testen

Test minstens:

- of de databasecontainer start;
- of de SQL zonder fouten uitgevoerd kan worden;
- of bestaande data correct blijft;
- of nieuwe velden opgeslagen worden;
- of gewijzigde data opnieuw opgehaald wordt;
- of de applicatie geen Prisma- of TypeScript-fouten geeft;
- of belangrijke schermen nog laden.

Mogelijke commando's, afhankelijk van het project:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm run build
```

### Rollback en herstel

Niet elke wijziging is eenvoudig terug te draaien. Maak daarom vooraf duidelijk wat het herstelplan is.

Voorbeelden:

- Bij een nieuwe kolom kan rollback betekenen dat de kolom opnieuw verwijderd wordt.
- Bij een datamigratie kan rollback betekenen dat een backup teruggezet moet worden.
- Bij een verwijderde tabel of kolom is rollback alleen veilig als er vooraf een backup is gemaakt.

Schrijf bij risicovolle wijzigingen kort op:

- wat er verandert;
- welke data geraakt wordt;
- hoe je de wijziging terugdraait;
- of er een backup nodig is.

### Checklist voor database- en softwarewijzigingen

- De wijziging is inhoudelijk duidelijk beschreven.
- `alter.sql` is aangepast voor bestaande databases.
- `init.sql` is aangepast voor nieuwe databases.
- Destructieve SQL is gecontroleerd.
- De wijziging is lokaal getest.
- Prisma is gesynchroniseerd indien nodig.
- Applicatiecode is aangepast.
- Validatie en formulieren zijn gecontroleerd.
- Belangrijke gebruikersflows zijn getest.
- Er is nagedacht over rollback of backup.

## English

### Purpose of this documentation

This documentation explains how to make database and software changes in a controlled way. The goal is to keep database changes, application code, and Prisma aligned.

Use this documentation when you want to:

- add, change, or remove a table;
- add, change, or remove a column;
- update relations, indexes, or constraints;
- correct or migrate existing data;
- update the application after a database change;
- synchronize Prisma with the database;
- start or test the local MariaDB database.

### Important files

This folder contains the database configuration and SQL files for the local MariaDB environment.

| File | Purpose |
| --- | --- |
| `compose.yaml` | Starts a local MariaDB container with Docker Compose. |
| `init.sql` | Initializes the database when the MariaDB container is created for the first time. |
| `alter.sql` | Contains SQL changes that can be applied to an existing database. |
| `db to prisma on local.sql` | Contains local database permissions and the Prisma sync instruction. |
| `db-start.sh` | Script to start the database environment, if used in the local workflow. |

### Difference between `init.sql` and `alter.sql`

`init.sql` is used for a new database. Docker runs this file when the MariaDB container is created for the first time and the database is still empty.

`alter.sql` is used for an existing database. Put changes here when they need to be applied without recreating the full database.

Practical rule:

- New installation needed? Make sure `init.sql` is correct.
- Existing database needs an update? Add the change to `alter.sql`.
- Should new and existing databases have the same structure? Update both files.

### Starting the local database

Start the local MariaDB database with:

```bash
docker compose up -d
```

Default configuration from `compose.yaml`:

| Setting | Value |
| --- | --- |
| Database | `app_db` |
| User | `app_user` |
| Password | `app_password` |
| Root password | `rootpassword` |
| Port | `3306` |
| Container name | `local-mariadb` |

Check whether the container is running:

```bash
docker ps
```

### When is a database change needed?

A database change is needed when the structure or contents of the database change. Examples:

- adding a new table;
- adding a column to an existing table;
- renaming a column or changing its datatype;
- adding a relation between tables;
- adding an index for better performance;
- adding required fields with `NOT NULL`;
- correcting existing records;
- removing old tables or columns.

### Process for database changes

Recommended process:

1. Describe what needs to change.
2. Check which tables, columns, and relations are affected.
3. Decide whether the change is local only or needed in other environments too.
4. Write the SQL change in `alter.sql`.
5. Update `init.sql` when new databases need the same structure.
6. Test the SQL locally.
7. Make sure existing data is preserved.
8. Synchronize Prisma if the software uses the changed tables.
9. Update the application code.
10. Test the full application flow.

### Example: adding a column

Suppose an extra `phone_number` field is needed on an existing `users` table.

For an existing database, add this to `alter.sql`:

```sql
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(30) NULL;
```

Then also update the `users` definition in `init.sql`, so new local databases include the column immediately.

Use `NULL` first when existing records do not have a value yet. Only make a column `NOT NULL` when existing data has a valid value or when you provide a default value.

### Example: adding a table

New tables belong in `init.sql`, but existing databases also need the same table through `alter.sql`.

Example in `alter.sql`:

```sql
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Make sure relations to other tables are added only after the related tables exist.

### Example: migrating existing data

Sometimes the existing data needs to change too.

Example:

```sql
UPDATE users
SET status = 'active'
WHERE status IS NULL;
```

Always test data changes locally first. Prefer using a clear `WHERE` clause so records are not changed accidentally.

### Handling destructive changes safely

Be extra careful with:

- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- `DELETE` without a clear `WHERE`
- `UPDATE` without a clear `WHERE`
- changes to primary keys or foreign keys
- datatype changes on columns with existing data

Recommended approach:

1. Create a backup or export first.
2. Check how many records will be affected.
3. Test the change locally.
4. Document why the destructive change is needed.
5. Apply the change only when the application has been updated for it.

### Software changes after database changes

When the database changes, the software often needs to change too. Examples:

- forms where new fields are entered;
- tables or detail pages where new data is shown;
- API routes that read or write data;
- validation for required fields;
- Prisma models;
- TypeScript types;
- seed or test data;
- reports or exports.

### Synchronizing Prisma

When Prisma is used, the Prisma schema must match the database.

Run this in the software project:

```bash
pnpm prisma db pull
```

This reads the existing database and updates the Prisma schema.

Afterwards, check:

- whether new tables are visible;
- whether new columns were added correctly;
- whether datatypes make sense;
- whether relations were detected correctly;
- whether old fields did not disappear unexpectedly.

Depending on the project, Prisma Client may also need to be regenerated:

```bash
pnpm prisma generate
```

### Process for software changes

Follow these steps when the application needs to be updated:

1. Make sure the database change works locally.
2. Synchronize Prisma if applicable.
3. Search the application code for usages of the affected table or column.
4. Update queries, services, API routes, or server actions.
5. Update forms, screens, and validation.
6. Resolve TypeScript errors.
7. Test the full user flow.
8. Make sure existing functionality still works.

### Testing

At minimum, test:

- whether the database container starts;
- whether the SQL can run without errors;
- whether existing data remains correct;
- whether new fields can be saved;
- whether changed data can be retrieved again;
- whether the application has no Prisma or TypeScript errors;
- whether important screens still load.

Possible commands, depending on the project:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm run build
```

### Rollback and recovery

Not every change is easy to undo. Define the recovery plan before applying risky changes.

Examples:

- For a new column, rollback can mean removing the column again.
- For a data migration, rollback can mean restoring a backup.
- For a removed table or column, rollback is only safe if a backup was created first.

For risky changes, briefly write down:

- what changes;
- which data is affected;
- how the change can be reverted;
- whether a backup is required.

### Checklist for database and software changes

- The change is clearly described.
- `alter.sql` is updated for existing databases.
- `init.sql` is updated for new databases.
- Destructive SQL has been checked.
- The change has been tested locally.
- Prisma has been synchronized if needed.
- Application code has been updated.
- Validation and forms have been checked.
- Important user flows have been tested.
- Rollback or backup has been considered.
