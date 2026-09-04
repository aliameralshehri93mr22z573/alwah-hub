import {
  reindexColumnTasks,
  type BoardData,
  type BoardTask,
} from "@/lib/board-types";

export function findTask(board: BoardData, taskId: string) {
  for (const column of board.columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) {
      return { column, task };
    }
  }
  return null;
}

export function orderedIdsByColumn(board: BoardData) {
  return Object.fromEntries(
    board.columns.map((column) => [
      column.id,
      column.tasks.map((task) => task.id),
    ]),
  );
}

export function moveTaskInBoard(
  board: BoardData,
  taskId: string,
  toColumnId: string,
  toIndex: number,
): BoardData {
  const columns = board.columns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }));

  let moving: BoardTask | undefined;
  for (const column of columns) {
    const index = column.tasks.findIndex((task) => task.id === taskId);
    if (index >= 0) {
      [moving] = column.tasks.splice(index, 1);
      break;
    }
  }

  if (!moving) {
    return board;
  }

  const destination = columns.find((column) => column.id === toColumnId);
  if (!destination) {
    return board;
  }

  const boundedIndex = Math.max(0, Math.min(toIndex, destination.tasks.length));
  destination.tasks.splice(boundedIndex, 0, moving);

  return {
    ...board,
    columns: columns.map((column) => ({
      ...column,
      tasks: reindexColumnTasks(column.tasks, column.id),
    })),
  };
}

export function upsertTask(board: BoardData, nextTask: BoardTask): BoardData {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks:
        column.id === nextTask.column_id
          ? column.tasks.some((task) => task.id === nextTask.id)
            ? column.tasks.map((task) =>
                task.id === nextTask.id ? nextTask : task,
              )
            : [...column.tasks, nextTask]
          : column.tasks.filter((task) => task.id !== nextTask.id),
    })),
  };
}

export function sameTaskOrder(left: BoardData, right: BoardData) {
  return JSON.stringify(orderedIdsByColumn(left)) === JSON.stringify(orderedIdsByColumn(right));
}
