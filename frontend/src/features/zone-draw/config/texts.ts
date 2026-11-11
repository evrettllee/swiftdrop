import { DRAW_TOOL, type DrawTool } from './draw';

export const TOOL_LABELS: Record<DrawTool, string> = {
  [DRAW_TOOL.POLYGON]: 'Многоугольник',
  [DRAW_TOOL.CIRCLE]: 'Круг',
  [DRAW_TOOL.RECTANGLE]: 'Прямоугольник',
};

export const DRAW_TEXTS = {
  TOOLBAR: 'Инструменты рисования',
  SNAP: 'Прилипание к соседним зонам',
  UNDO: 'Отменить',
  CLEAR: 'Стереть',
  MAP_LABEL: 'Карта: граница зоны',
  LOADING: 'Загружаем карту',
  radius: (km: string) => `${km} км`,
} as const;

export const HINT_TEXTS = {
  PICK: 'Выберите многоугольник, круг или прямоугольник',
  POLYGON: 'Кликайте по карте. Замкните контур на первой точке',
  POLYGON_TOUCH: 'Касайтесь карты, замкните на первой точке',
  CIRCLE: 'Кликните в центр, затем тяните край или введите радиус',
  CIRCLE_TOUCH: 'Коснитесь центра, затем тяните край',
  RECTANGLE: 'Кликните в один угол, затем в противоположный',
  RECTANGLE_TOUCH: 'Коснитесь угла, затем противоположного',
  EDIT: 'Тяните вершины. Точка на ребре добавит новую',
} as const;

export const LEAVE_TEXTS = {
  TITLE: 'Уйти со страницы?',
  TEXT: 'Несохранённые изменения пропадут.',
  LEAVE: 'Уйти',
  STAY: 'Остаться',
} as const;

export const SAVE_TEXTS = {
  REFRESH: 'Обновить',
  RETRY: 'Повторить',
} as const;

export const RADIUS_TEXTS = {
  RADIUS: 'Радиус, км',
  RADIUS_HINT: 'Или тяните край круга на карте.',
  RADIUS_INVALID: 'Радиус: от 0,1 до 50 км',
  TO_POINTS: 'Править по точкам',
} as const;
