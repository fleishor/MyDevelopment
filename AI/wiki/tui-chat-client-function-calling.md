# Function Calling im Textual-Chatclient

Diese Seite beschreibt den Ablauf in `tui_chat_client_function_call.py`, insbesondere `ChatApp._get_answer` und `ChatApp._handle_function_calls`.

## Überblick

Der Chatclient sendet den Gesprächsverlauf an die OpenAI Responses API und stellt ihr das Tool `read_file` über `TOOLS` zur Verfügung. Die API kann entweder direkt eine Antwort liefern oder einen Function Call anfordern. Im zweiten Fall führt der Client das Tool lokal aus, sendet das Ergebnis zurück an die API und fragt erneut an. Dieser Ablauf wiederholt sich, bis eine Antwort ohne weitere Function Calls vorliegt.

## `ChatApp._get_answer`

`_get_answer` ist der asynchrone Worker für eine Benutzernachricht. `on_input_submitted` hat die Nachricht zu diesem Zeitpunkt bereits in `self.history` eingetragen, das Eingabefeld deaktiviert und den Busy-Zustand gesetzt.

Der Ablauf:

1. Holt die Widgets für Chat, Status und Eingabe.
2. Erstellt `request_input` als Kopie von `self.history`. Die Kopie wird für die mehrstufige API-Unterhaltung verwendet, ohne den Verlauf vorzeitig zu verändern.
3. Ruft `self.client.responses.create` mit Modell, Systemanweisungen, `request_input`, `TOOLS`, `store=False` und deaktiviertem Reasoning auf.
4. Übergibt die Antwort an `_handle_function_calls`.
   - `True`: Mindestens ein Function Call wurde verarbeitet. Die Schleife stellt den aktualisierten Request-Inhalt erneut an die API.
   - `False`: Es gab keinen Function Call. Die Schleife endet und die finale Textantwort wird verarbeitet.
5. Liest `response.output_text`, entfernt führende und folgende Leerzeichen und verwendet einen Ersatztext, falls die Antwort leer ist.
6. Fügt die Assistentenantwort zu `self.history` hinzu. Bei mehr als `MAX_HISTORY_MESSAGES` Einträgen werden jeweils die ersten zwei Nachrichten entfernt; damit bleibt der Verlauf auf vollständige Benutzer-/Assistenten-Paare ausgerichtet.
7. Zeigt die Antwort als Rich-Markdown an. Sind Nutzungsdaten vorhanden, zeigt die Methode zusätzlich Tokenzahlen einschließlich Cache- und Reasoning-Tokens an.

Bei `APIConnectionError`, `APIStatusError` und anderen `OpenAIError`-Fehlern entfernt `_get_answer` die zuletzt angehängte Benutzernachricht aus dem Verlauf und zeigt eine passende Meldung an. Der `finally`-Block setzt den Busy-Zustand zurück, leert die Statuszeile, aktiviert das Eingabefeld wieder und fokussiert es.

## `ChatApp._handle_function_calls`

Signatur:

```python
async def _handle_function_calls(
    self,
    response: Any,
    request_input: list[Any],
    chat: RichLog,
) -> bool:
```

Die Methode verarbeitet Function Calls aus einer einzelnen Responses-API-Antwort:

1. **Calls herausfiltern:** Sie durchsucht `response.output` und behält Einträge, deren `type` gleich `function_call` ist.
2. **Kein Call:** Ist die Liste leer, schreibt sie `No function_calls requested` ins Chat-Log und gibt `False` zurück. Dadurch weiß `_get_answer`, dass die Schleife beendet werden kann.
3. **Modellantwort in den Folge-Request übernehmen:** Wenn Calls vorhanden sind, fügt sie alle Elemente aus `response.output` zu `request_input` hinzu. Dazu gehören auch die Function-Call-Elemente, auf die sich die folgenden Ergebnisse beziehen.
4. **Jeden Call ausführen:** Für jeden Call zeigt sie die Call-Information im Chat-Log an, parst `function_call.arguments` mit `json.loads` und ruft `self.read_file(**arguments)` auf.
5. **Fehler als Tool-Ergebnis behandeln:** `OSError`, `TypeError` und `ValueError` werden abgefangen. Statt den gesamten Chat-Worker abzubrechen, wird der Fehlertext als `read_file failed: ...` in die Tool-Antwort übernommen.
6. **Ergebnis zuordnen:** Für jeden Call hängt sie ein `function_call_output`-Objekt an `request_input` an. Die `call_id` ordnet das Ergebnis dem passenden Aufruf zu; `output` enthält den Dateiinhalt oder die Fehlermeldung.
7. **Weiterlaufen lassen:** Nach Verarbeitung aller Calls gibt die Methode `True` zurück. `_get_answer` sendet daraufhin den erweiterten `request_input` erneut an die API.

Das Ergebnisobjekt sieht beispielsweise so aus:

```python
{
    "type": "function_call_output",
    "call_id": function_call.call_id,
    "output": result,
}
```

`_handle_function_calls` ruft die API nicht selbst auf. Sie bereitet lediglich den nächsten Request vor; die Schleife und die API-Aufrufe bleiben in `_get_answer`.

## Sicherheits- und Betriebsaspekt

`read_file` öffnet den übergebenen Pfad direkt mit UTF-8. In dieser Proof-of-Concept-Version wird der Pfad nicht auf ein bestimmtes Verzeichnis begrenzt. Deshalb sollte das Tool nur in einer vertrauenswürdigen Umgebung verwendet oder vor produktivem Einsatz mit einer Pfadbeschränkung versehen werden.
