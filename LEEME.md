# AI-901 Quest

Juego RPG web para estudiar el examen **AI-901: Microsoft Azure AI Fundamentals**.

## Cómo jugar

Abre `index.html` con doble clic (Chrome, Edge o Firefox). No hace falta instalar nada ni conexión a internet
(solo se usa internet para la tipografía y para los enlaces a Microsoft Learn).

- **Mapa**: 2 regiones = 2 rutas de aprendizaje. 15 zonas = 15 módulos.
  - Ruta 1 · Reino de los Conceptos: *AI concepts for developers and technology professionals* (7 módulos).
  - Ruta 2 · Ciudadela Foundry: *Get started with AI applications and agents on Azure* (8 módulos).
- **Zona**: cada unidad del módulo tiene su teoría y un desafío de preguntas. Al final, el **guardián** (jefe) del módulo:
  acierta el 70 % de sus preguntas antes de quedarte sin corazones para derrotarlo y desbloquear la siguiente zona.
- **Repaso (⛩️)**: cada pregunta fallada va al Templo del Repaso hasta que la aciertes 2 veces seguidas.
- **Biblioteca (📖)**: glosario español/inglés con buscador y fichas de memoria.
- **Simulacro (🏰)**: examen cronometrado con preguntas de todos los módulos, repartidas según el peso de la guía
  (40–45 % conceptos, 55–60 % Foundry). Puntuación 0–1000, se aprueba con 700.
- **Progreso (📊)**: avance por módulo y precisión por área de la guía de estudio.
- **Tienda (🛒)**: pociones, 50/50 y escudos para las batallas, pagados con las monedas que ganas.

El progreso se guarda en el navegador. Usa *Ajustes → Exportar progreso* para hacer copia o cambiar de equipo.

## Estructura

- `data/modules/mXX.json`: contenido de cada módulo (teoría, ejercicios, guardián, glosario). Formato en `data/ESQUEMA.md`.
- `tools/validar.py`: valida los JSON y regenera `js/data.js` (`python tools/validar.py`). Ejecútalo tras editar cualquier módulo.
- `js/app.js`, `css/style.css`, `index.html`: el juego.
