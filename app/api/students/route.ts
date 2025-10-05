import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Попытка получить студентов из Supabase...');
    const { data: students, error } = await supabase
      .from('students') // Предполагается, что у вас есть таблица 'students'
      .select('name, group'); // Выбираем name и group

    if (error) {
      console.error('Ошибка при получении студентов из Supabase:', error);
      console.error('Детали ошибки Supabase:', error); // Дополнительное логирование ошибки
      return NextResponse.json({ message: 'Ошибка при получении студентов', details: error.message }, { status: 500 });
    }

    console.log('Полученные студенты из Supabase:', students); // Логирование полученных данных

    // Маппинг префиксов групп к полным названиям направлений
    const directionPrefixMap: { [key: string]: string } = {
      "МЕН": "Менеджмент",
      "ПСИ": "Психология",
      "КФЛ": "Конфликтология",
      "ЮСТ": "Юриспруденция",
      "СРБ": "Социальная работа",
      // Добавьте другие префиксы по мере необходимости
    };

    // Преобразуем данные в формат { value: "ф.и.о.", label: "Ф.И.О.", group: "Группа", direction: "Направление" }
    const formattedStudents = students.map((student: any) => {
      const groupPrefix = student.group.substring(0, 3).toUpperCase();
      const directionName = directionPrefixMap[groupPrefix] || groupPrefix;
      return {
        value: student.name.toLowerCase(),
        label: student.name,
        group: student.group,
        direction: directionName,
      };
    });

    // Извлекаем уникальные направления и группы из уже отформатированных студентов
    const directionsMap = new Map();
    const groupsMap = new Map();

    formattedStudents.forEach((student: any) => {
      if (!directionsMap.has(student.direction)) {
        directionsMap.set(student.direction, { value: student.direction, label: student.direction });
      }

      if (!groupsMap.has(student.group)) {
        groupsMap.set(student.group, { value: student.group, label: student.group, direction: student.direction });
      }
    });

    const directions = Array.from(directionsMap.values());
    const groups = Array.from(groupsMap.values());

    return NextResponse.json({ students: formattedStudents, directions, groups }, { status: 200 });
  } catch (error: any) {
    console.error('Непредвиденная ошибка при получении студентов:', error);
    return NextResponse.json({ message: 'Непредвиденная ошибка сервера', details: error.message }, { status: 500 });
  }
}
