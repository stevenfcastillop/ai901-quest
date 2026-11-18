# Esquema de datos de módulos — AI-901 Quest

Cada módulo es un archivo `data/modules/mXX.json` (UTF-8, JSON válido, sin comentarios).

## Reglas de redacción

- Todo en **español**. Los términos técnicos clave se escriben con la marca `{{español|inglés}}`,
  por ejemplo `{{incrustaciones|embeddings}}` o `{{modelo de lenguaje grande|large language model (LLM)}}`.
  El juego muestra el español y, al lado, una etiqueta con el término en inglés.
  Úsala la primera vez que aparece un término en cada unidad (no en cada frase).
  Los nombres de producto (Microsoft Foundry, Azure Speech, Content Understanding, Foundry IQ…) se dejan en inglés sin marca.
- Formato en línea permitido: `**negrita**` y `` `código` ``.
- **Redacta con tus propias palabras.** No copies párrafos ni preguntas de Microsoft Learn literalmente: resume y explica
  cada concepto de forma completa y fiel. Debe cubrir TODA la teoría de cada unidad (definiciones, listas, ejemplos,
  tablas comparativas, parámetros, pasos de los laboratorios, fragmentos de código relevantes).
- Las preguntas son **originales** (estilo examen AI-901), no copias de las comprobaciones de conocimientos.

## Estructura

```json
{
  "id": "m01",
  "path": 1,
  "order": 1,
  "title": "Introducción a los conceptos de IA",
  "titleEn": "Introduction to AI concepts",
  "url": "https://learn.microsoft.com/en-us/training/modules/get-started-ai-fundamentals/",
  "summary": "Una o dos frases sobre el módulo.",
  "objectives": ["Objetivo de aprendizaje 1", "..."],
  "units": [
    {
      "id": "m01u1",
      "title": "Introducción",
      "titleEn": "Introduction",
      "url": "https://learn.microsoft.com/en-us/training/modules/get-started-ai-fundamentals/1-introduction",
      "kind": "teoria",
      "theory": [
        { "type": "h", "text": "Subtítulo" },
        { "type": "p", "text": "Párrafo con {{término|term}} y **negrita**." },
        { "type": "list", "items": ["punto 1", "punto 2"] },
        { "type": "table", "head": ["Col A", "Col B"], "rows": [["a", "b"]] },
        { "type": "code", "lang": "python", "text": "print('hola')" },
        { "type": "tip", "text": "Consejo de examen o dato clave." },
        { "type": "example", "text": "Ejemplo práctico / escenario." }
      ],
      "exercises": [ "...preguntas (ver abajo)..." ]
    }
  ],
  "boss": [ "...8 a 10 preguntas que mezclan todo el módulo..." ],
  "glossary": [
    { "es": "Incrustación", "en": "Embedding", "def": "Definición breve en español." }
  ]
}
```

`kind` de unidad: `"teoria"`, `"laboratorio"` (unidad de ejercicio práctico: describe objetivo, pasos y código clave),
`"evaluacion"` (comprobación de conocimientos: pon un repaso de los conceptos clave en `theory` y preguntas originales),
`"resumen"`.

## Preguntas

Campos comunes: `"type"`, `"q"` (enunciado), `"explain"` (por qué es correcta, 1-3 frases), `"obj"` (objetivo del examen).
Se puede usar la marca `{{es|en}}` en enunciados, opciones y explicaciones.

| type | campos extra | notas |
|---|---|---|
| `mc` | `options` (3-4 textos), `answer` (índice desde 0) | una sola respuesta |
| `multi` | `options` (4-5), `answers` (lista de índices) | el enunciado indica cuántas elegir |
| `tf` | `answer` (true/false) | verdadero/falso |
| `match` | `pairs`: `[["izquierda","derecha"], ...]` (3-5 pares) | relacionar columnas |
| `order` | `items` en el orden CORRECTO (3-6) | el juego los desordena |

### Códigos `obj` (áreas de la guía de estudio AI-901, abril 2026)

- `A1` Principios de IA responsable (equidad, fiabilidad y seguridad, privacidad y seguridad, inclusión, transparencia, responsabilidad)
- `A2` Componentes y configuración de modelos (cómo funcionan los modelos generativos, elegir modelo, despliegue y parámetros)
- `A3` Cargas de trabajo de IA (generativa/agéntica, análisis de texto, voz, visión, extracción de información)
- `B1` Apps y agentes generativos con Foundry (prompts de sistema/usuario, desplegar modelo, SDK de chat, agentes)
- `B2` Texto y voz con Foundry (análisis de texto, prompts hablados con modelo multimodal, Azure Speech)
- `B3` Visión y generación de imágenes con Foundry
- `B4` Extracción de información con Content Understanding (documentos, imágenes, audio, vídeo)

## Cantidades

- Cada unidad (incluidas introducción y resumen): 2-4 ejercicios. Unidades de teoría densas: 3-4.
- `boss`: 8-10 preguntas, variedad de tipos (al menos 1 `match` o `order`).
- `glossary`: 6-15 términos.
