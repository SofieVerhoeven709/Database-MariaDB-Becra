[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ZQkUYFyq)
# Opgave

Voor het vak backend frameworks werk je **individueel** een project uit met Next.js, Tailwind, shadcn/ui, Prisma en
Postgres.

Dit project wordt geëvalueerd in twee delen.
Het eerste deel (15&percnt;) moet ingeleverd worden tegen het einde van de laatste lesdag voor de kerstvakantie (dagopleiding)
of de paasvakantie (werktraject).
De deadline van het tweede deel (85&percnt;) kan je vinden op Canvas, na deze deadline ligt je jouw project toe tijdens een
mondelinge verdediging.

## Toegestane hulpmiddelen

Je mag voor dit project gebruik maken van bronnen zoals tutorials, voorbeelden en StackOverflow.
Dit betekent echter niet dat je project hier volledig op gebaseerd is.
We controleren je inzendingen en indien grote gelijkenissen met online bronnen gedetecteerd worden, dan is dit plagiaat
en wordt een fraudeprocedure gestart.

Generative AI-tools mogen gebruikt worden, maar we verwachten dat je alle code die door deze tools gegenereerd wordt kan
verklaren.
Dit wordt dan ook ondervraagd op de mondelinge verdediging.

Het is toegestaan om delen uit de lesvoorbeelden of opgeloste oefeningen te herbruiken.
Als je dit doet, moet je dit op een innovatieve manier doen, anders verdien je hier geen punten mee.
Als je twijfelt of jouw code voldoende verschillen vertoond met de code uit de lessen, dan kan je jouw lector hier
natuurlijk over contacteren.

De enige uitzondering op bovenstaande regel is de code die in het startrepository beschikbaar is, aangezien deze code
veelgebruikte taken afzondert in herbruikbare functies en aangezien hier weinig tot geen variate in mogelijk is, mag je
deze code integraal gebruiken in je eigen project.

## Begeleiding

Tijdens het bouwen van de applicatie is het toegestaan raad te vragen aan de begeleidende docent.

Vragen over leerstof die gezien is tijdens de lessen worden zelden beantwoord, je wordt meestal doorverwezen naar het
relevante lesmateriaal.
Als je echter kan aantonen dat je het cursusmateriaal gebruikt heb en geprobeerd hebt om een feature zelf te
implementeren, word je geholpen, ook als dit gaat over leerstof die wel in de les behandeld is.
Vragen over features van Next of React die in geen enkele les of oefening gezien zijn worden sowieso beantwoord.

Met vragen over conceptuele problemen zoals het structureren van je app of dingen die je niet geprogrammeerd krijgt,
maar die los staan van de geziene leerstof kan je altijd terecht bij je begeleidende docent.
Je wordt echter gecoacht in het vinden van een oplossing en krijgt deze niet voorgeschoteld.

Indien er problemen ontstaan door bibliotheken die niet meer werken door updates, updates van de IDE, deprecated
features … kan je hier natuurlijk ook hulp voor vragen.

Als je code van ergens gecopy-pastet hebt (of dat nu van een AI tool komt of van 'het internet'), dan kunnen de docenten
hulp weigeren als ze zien dat je de code onvoldoende zelf begrijpt. Uitzonderingen hierop zijn code voorbeelden die
rechtstreeks uit de documentatie van de tool/library/framework komen.

## Kwaliteit

De kwaliteit van je code wordt beoordeeld op basis van onderstaande, **niet exhaustieve**, lijst.
Omdat je voor een functionerend project al veel punten kunt verdienen (80&percnt;) wordt de kwaliteit en complexiteit van je
code streng beoordeeld.

* Naamgeving van variabelen
    * Correct gebruik van enkelvoud/meervoud in de namen
    * Duidelijke namen
* Types
    * Types van variabelen
    * Types van functies
* Gebruik van enums waar toepasbaar
* Geen diep geneste callbacks
* Gebruik van interfaces/types in de plaats van objecten met het any type
* Consistentie in de code, geen mix van () =&gt; {} en function() {} in eenzelfde bestand.
* Volgen van de linting regels die geconfigureerd zijn in ESLint en de stijlregels die geconfigureerd zijn voor
  Prettier (deze regels mogen aangepast worden, zolang je één bepaalde code-style aanhoud en niet alle regels op 'off'
  zet, is er geen probleem)
* Geen hard gecodeerde gegevens
* Opsplitsen in componenten waar nuttig
* Leesbaarheid
* Bruikbaarheid van de UI
* Aanwezigheid van Suspense boundaries
* Aanwezigheid van indicators tijdens het laden en bewerken van data
* Features die boven onderstaande minimumvereisten uitsteken
* Correct gebruikt van server en client components

## Combinatie met Mobile Development

Het is toegestaan om dit project te combineren met je project van Mobile Development.
Dit doe je door een API te schrijven waarmee je mobiele applicatie communiceert, deze API moet beveiligd worden met een
JSON Web Token (JWT).
Het is natuurlijk toegestaan om de API uit te breiden met extra endpoints die dingen doen die uniek zijn aan je mobiele
applicatie en niet gebruikt worden door je Next applicatie.
Voor meer informatie verwijzen we naar [appendix](https://javascript.pit-graduaten.be/lessen/appendix/deploying_next.html).

**Als je jouw projecten voor Mobile development en Backend Frameworks combineert via een API, verdien je hier extra
punten mee. Je kan 20/20 scoren zonder een API te bouwen, maar als je een API bouwt kan je daar 1/20 bonus punten mee
verdienen.**

## Git

Je maakt verplicht gebruik van een Git repository via de GitHub classroom link die je in Canvas vindt.
Dit is de enige plaats waar je code moet inzenden, code die via andere kanalen ingezonden wordt, wordt niet beoordeeld.

Als je de deadline mist, is dit jouw verantwoordelijkheid.
Zet je code vanaf het begin op git en commit elke wijziging, zo wordt het onmogelijk om de deadline te missen.

Enkel code die op de **main** branch gepusht is wordt gecontroleerd.
Je maakt natuurlijk wel gebruik van andere branches, maar als het niet gemerged is met de main branch, wordt het niet
beoordeeld.

## Mondeling examen

Het mondelinge examen verloopt via Teams.
Zet voordat je opgebeld wordt de code van het project open in WebStorm (of soortgelijke editor).
Zorg er natuurlijk ook voor dat je website gecompileerd is en geopend is in een browser.

Het examen verloopt als volg:

- Je begint met een demonstratie van de functionaliteit van de applicatie, als je bijzonder indrukwekkende dingen
  geïmplementeerd hebt vermeld je dat hier zeker.
- Je docent stel een aantal vragen over de applicatie.
  Dit zijn in eerste instantie architecturale vragen zijn (structuur en samenhang van de code) en vragen over de werking
  van de code.
  Daarnaast kunnen er ook minder goede delen van de code aangekaart worden en kunnen we je vragen wat er verkeerd is en
  hoe je het zou oplossen.
  De eerste soort vraag dient om af te toetsen of je de code begrijpt en je project zelf geschreven heb, de laatste
  vragen dienen om eventueel een (klein) beetje punten meer te kunnen geven dan als we puur naar de ingezonden code
  zouden kijken.

## Deel 1

Tijdens het eerste deel van het project bouw je de UI van je applicatie uit, voorzie je een databaseschema en
implementeer je registratie en login functionaliteiten.

### UI

Om de UI van de applicatie uit te bouwen, gebruik je verplicht een AI-tool om je prototype op te bouwen.
De docenten raden [v0.dev](https://v0.dev/), maar je bent vrij om een andere tool te kiezen, mits deze aan de volgende
voorwaarden voldoet:

1. De tool kan gebruikt worden om iteratief een volledige applicatie te bouwen.
   Onder volledige applicatie verstaan we een applicatie die uitgevoerd kan worden zonder extra code te moeten schrijven.
2. De tool maakt het mogelijk om het resultaat van je AI-prototyping te delen met je docenten (zonder dat hiervoor een
   account aangemaakt moet worden).
   Dit gedeelde resultaat moet de geschiedenis van de iteratieve aanpassingen bevatten, bekijk de
   [Voorbeeldchat](https://v0.app/chat/next-js-book-manager-sXwZf5h6lK2?utm_source=sebastiaanhenau&utm_medium=referral&utm_campaign=share_chat&ref=Z2U9PK)
   om een beter idee te krijgen over wat we moeten zien.
3. De tool kan een applicatie bouwen in **Next.js**, **Tailwind** en **shadcn/ui**.

Voor de specifieke evaluatiecriteria verwijzen we door naar de **rubric in Canvas**.

#### Combinatie met startbestanden

De startbestanden bevatten verschillende nuttige bestanden.
Enerzijds de linting en formatting configuratie, anderzijds ook utility functies en hooks voor authenticatie, form
actions, server functions, hook form, ...

We verwachten dat je het project dat door de AI-tool gegenereerd is samen voegt met de startbestanden zonder de
startbestanden te overschrijven.

### Database

Je voorziet een volledig databaseschema dat opgebouwd is met één of meer migrations in **Prisma**.
Natuurlijk komt dit schema overeen met de UI die je door een AI-tool heb laten genereren, er mogen hier en daar nog
enkele kleine verschillen zijn, maar de grote lijnen moeten dezelfde zijn.

Je relationeel model bevat minstens 8 tabellen, één veel-op-veel relaties en één tabel met minstens 7 attributen
(exclusief primary key).
Veel-op-veel relaties tellen mee als een tabel, ook als je deze op de achtergrond laat aanmaken door Prisma en deze niet
expliciet in je Prisma schema opneemt.
Enums tellen niet mee als een tabel.

Aangezien je ook authenticatie moet voorzien, heb je minstens een _User_ en _Session_ tabel nodig, daarnaast is er
natuurlijk ook een _Role_ enum aanwezig.
Er zijn dus nog 6 andere tabellen nodig.

#### Testdata

Om je applicatie te testen voorzie je een seed script waarmee er minstens 10 records per tabel worden aangemaakt.

Voor de _Session_ en _User_ tabellen volstaat het om 1 record (gebruiker) aan te maken, tenzij je met meerdere rollen
gewerkt hebt, dan maak je voor elke rol een gebruiker aan.

Voeg de inloggegevens voor elke gebruiker toe aan je readme.md bestand.

### Authenticatie

De enige CRUD-operaties die moeten werken in deel 1 van je project zijn **inloggen** en **registreren**.
Zorg ervoor dat deze op een correcte manier geïmplementeerd zijn, je mag al validatie toevoegen via Zod, maar dit
moet niet.

Je implementeert deze authenticatie via een JSON Web Token die in een veilig HTTP-only cookie bewaard wordt.
Deze token moet alle informatie over de gebruiker en sessie bevatten. 

## Deel 2

Tijdens deel 2 van het project voeg je CRUD-acties toe voor alle tabellen in de database die gevalideerd worden met Zod
en enkel beschikbaar zijn voor geauthenticeerde en geautoriseerde gebruikers.

Voor elk van de tabellen moeten read, create, update en delete operaties voorzien zijn.
Je mag hier enkel van afwijken als je meer dan 8 tabellen hebt in je database.

### Read operaties

Je maakt verplicht gebruik van _server components_ om data op te halen en te tonen op je webpagina.
Enkel in heel specifieke situaties, die je goed kan beargumenteren op het mondeling examen, mag je een _API-route_
gebruiken om data op te halen.

### Formulieren

De formulieren die je gebruikt om de CRUD-operaties te implementeren moeten verplicht gebruik maken van
_react-hook_form_, _Zod_, _server functions_ en _server actions_.

De formulieren moeten zowel _client-side_ als _server-side_ gevalideerd worden, hiervoor maak je verplicht gebruik van
Zod schema's.

Voor formulieren die ingestuurd worden via _API-routes_ krijg je **geen punten**.

### Validatie

We verwachten dat je correct gebruik maakt van Zod, dit betekent dat je schema's hergebruikt, combineert, specifieert,
...
Als je voor elke operatie volledig nieuwe schema's bouwt, zul je hier aanzienlijk wat punten mee verliezen.
Je moet dus gebruik maken van de _extend_, _merge_, _pick_, _omit_, ... methodes.

### Logging

Voor elke operaties moeten logs aanwezig zijn.
We willen minstens het volgende loggen:

1. Operatie is gestart (inclusief de naam van de operatie, voor generische namen zoals "server function" verlies je punten)
2. Eventuele foutmeldingen
3. Belangrijke events in de operatie (user aangemaakt, sessie gestart, gefaalde login pogingen, ...)
4. Operatie is beëindigd, inclusief de tijd die hiervoor nodig was

Elk van de logs moet een _requestId_, _pad_ en _methode_ bevatten, in het geval dat het request gedaan wordt door een
ingelogde gebruiker voeg je ook het _userId_ en _sessionId_ toe.

Voor request naar statische assets zoals afbeeldingen, mag geen log statement uitgeprint worden.

### Authenticatie & autorisatie

Elke pagina in de applicatie moet afgeschermd worden zodat enkel geauthenticeerde en geautoriseerde gebruikers toegang
hebben tot pagina's, server functions en route handlers.

Je implementeert deze authenticatie via een JSON Web Token die in een veilig HTTP-only cookie bewaard wordt.
Deze token moet alle informatie over de gebruiker en sessie bevatten.

Je gebruikt een twee-staps-proces om de bevoegdheid van de gebruiker te valideren

1. Read operaties worden in eerste instantie gevalideerd in een proxy functie die de database enkel aanspreekt in
   uitzonderlijke gevallen en meestal werkt op basis van de data in de JWT.
    - Indien een pagina informatie over de gebruiker nodig heeft, controleer je de geldigheid van de sessie via de
      database. Dit mag echter enkel gebeuren in het Next process en niet in de proxy functie.
2. Create, delete of update operaties moeten altijd via de database gevalideerd worden. 