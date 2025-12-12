// Этот файл содержит намеренно внесённые статические ошибки для тестирования анализаторов.
// Файл не импортируется из основного кода — он существует только для статического анализа.

// 1) Использование eval() — нарушение безопасности / код-стиль
export function useEvalExample(code) {
  // eslint-disable-next-line no-unused-vars
  const result = eval(code); // <- should be flagged by security linters (no-eval)
  return result;
}

// 2) Небезопасная конкатенация SQL (возможная SQL-инъекция)
export function vulnerableSql(orderBy) {
  // потенциально уязвимая строка, линтеры безопасности должны заметить
  const q = "SELECT id, url FROM cats ORDER BY " + orderBy;
  return q;
}

// 3) Присваивание в условии (логическая ошибка)
export function assignInCondition() {
  let a = 0;
  if (a = 1) { // <- присваивание вместо сравнения
    return true;
  }
  return false;
}

// 4) Плохая обработка исключений — пустой catch (подавление ошибок)
export function swallowErrors() {
  try {
    JSON.parse('{'); // вызовет исключение
  } catch (e) {
    // intentionally empty: bad practice
  }
}

// 5) Простой пример утечки памяти (накопление в глобальной переменной)
export const _leakArray = [];
export function leakMemoryExample() {
  // Добавляем большие объекты в массив — аналитики поведения/памяти должны заметить
  for (let i = 0; i < 100; i++) {
    _leakArray.push(new Array(1000).fill('leak'));
  }
}
