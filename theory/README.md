# Theory Articles - i18n Integration

## Быстрый старт / Quick Start

Все статьи из папки `theory/articles/` переведены и интегрированы в систему i18n.

All articles from the `theory/articles/` folder have been translated and integrated into the i18n system.

## Использование / Usage

### В React компонентах / In React Components

```typescript
import { useTranslation } from 'react-i18next';

function TheoryArticle({ subtopic }: { subtopic: string }) {
  const { t } = useTranslation('theory');
  
  const title = t(`${subtopic}.title`);
  const content = t(`${subtopic}.content`);
  
  return (
    <div>
      <h1>{title}</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

### Доступные статьи / Available Articles

- `linear_equations` - Линейные уравнения / Linear Equations
- `quadratic_equations` - Квадратные уравнения / Quadratic Equations  
- `systems_of_equations` - Системы уравнений / Systems of Equations
- `ratios_and_proportions` - Пропорции и отношения / Ratios and Proportions
- `exponents_and_radicals` - Степени и корни / Exponents and Radicals
- `functions_basics` - Основы функций / Functions Basics

## Файлы / Files

- **Исходники / Source**: `theory/articles/*.md` (Russian)
- **Русский / Russian**: `frontend/src/locales/ru/theory.json`
- **Английский / English**: `frontend/src/locales/en/theory.json`

## Перевод / Translation

Для перевода новых или обновленных статей:

To translate new or updated articles:

```bash
python scripts/translate_theory_articles.py
```

Скрипт автоматически:
- Парсит markdown файлы
- Переводит через Google Translate
- Сохраняет LaTeX выражения
- Генерирует JSON файлы

The script automatically:
- Parses markdown files
- Translates via Google Translate
- Preserves LaTeX expressions
- Generates JSON files

## Подробная документация / Detailed Documentation

См. / See: [THEORY_I18N.md](../THEORY_I18N.md)
