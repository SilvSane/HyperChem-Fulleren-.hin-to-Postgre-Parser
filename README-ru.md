# HIN Parser & PostgreSQL Migrator

Консольная утилита на Node.js для парсинга научных файлов структуры фуллеренов (`.hin`) и их автоматической миграции в базу данных PostgreSQL.

Автор - SilvSane

## Особенности архитектуры
- **Идемпотентность:** Повторный запуск скрипта полностью пересоздает таблицы, исключая дублирование данных.
- **Поочередный импорт:** Использование ESM и Top-level `await` гарантирует строгую последовательность обработки тяжелых дисковых операций.
- **Безопасность:** Параметризованные SQL-запросы для защиты от инъекций; изоляция конфигов через встроенный `.env` в Node.js.
- **Гибкий парсинг:** Поддержка форматов файлов C30 (`**`) и C70 (`CA`), включая автоматический пропуск метаданных скоростей и базисов.

## Быстрый старт

1. Склонируйте репозиторий и установите зависимости:
   ```bash
   npm install
   ```

2. Создайте пустую базу данных в PostgreSQL (например, через pgAdmin).

3. Настройте конфигурацию окружения:
   - Скопируйте файл `.env.example` и переименуйте его в `.env`.
   - Заполните ваши доступы к PostgreSQL (логин, хост, пароль, порт).

4. Откройте файл `main.js`, раскомментируйте примеры и подставьте туда свои пути к файлам и желаемые названия таблиц PostgreSQL.

5. Запустите импорт данных:
   ```bash
   npm start
   ```

## Пример использования (`main.js`)

Внутри `main.js` уже всё подключено и настроено. Вам нужно лишь раскомментировать примеры, вставить свои пути к `.hin` файлам и указать названия итоговых таблиц:

```javascript
import { ParseHin } from "./insert.js";

// //paths examples (ВСТАВЬТЕ СВОИ ПУТИ К ФАЙЛАМ ТУТ)
// const path30 = "n:/Computer Moduling Physics/fullerens/c30.hin";
// const path70 = "n:/Computer Moduling Physics/fullerens/C70.hin";
// const path56 = "n:/Computer Moduling Physics/fullerens/c56.hin";
// const path44 = "n:/Computer Moduling Physics/fullerens/c44.hin";

console.log("File import...");
// //usage examples (УКАЖИТЕ НАЗВАНИЯ ТАБЛИЦ ТУТ)
// await ParseHin(path30, "C30");
// await ParseHin(path70, "C70");
// await ParseHin(path56, "C56");
// await ParseHin(path44, "C44");

console.log("All successed!");
```

## Структура базы данных

Для каждого обработанного файла скрипт автоматически создает таблицу со следующими колонками:
- `id` (SERIAL PRIMARY KEY)
- `atom_number` (INTEGER)
- `energy` (NUMERIC)
- `x`, `y`, `z` (NUMERIC) — Пространственные координаты атомов
- `connection_count` (INTEGER)
- `connections` (INTEGER[]) — Массив индексов связанных атомов
- `connection_types` (TEXT[]) — Массив символов типов химических связей
