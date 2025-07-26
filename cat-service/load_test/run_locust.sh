#!/bin/bash

# Проверяем, установлен ли Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python не установлен"
    echo "Установите Python с https://www.python.org/"
    exit 1
fi

# Проверяем, установлен ли pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip не установлен"
    echo "Установите pip: python3 -m ensurepip --upgrade"
    exit 1
fi

# Проверяем наличие виртуального окружения
if [ ! -d "venv" ]; then
    echo "🔧 Создаем виртуальное окружение..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем зависимости
echo "📦 Проверяем зависимости..."
pip install -r requirements.txt

# Запускаем Locust
echo "🚀 Запускаем Locust..."
echo "📊 Откройте http://localhost:8089 в браузере"
echo "🔍 Для запуска теста укажите:"
echo "   - Number of users: 10"
echo "   - Spawn rate: 1"
echo "   - Host: http://localhost:3000"
echo ""
echo "⚠️ Для остановки нажмите Ctrl+C"
echo ""

locust -f locustfile.py --host http://localhost:3000 