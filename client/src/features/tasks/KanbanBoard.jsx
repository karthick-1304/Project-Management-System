import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { useState } from 'react';
import TaskCard from './TaskCard.jsx';
import { TASK_STATUS_LABEL } from '../../lib/format.js';

const COLUMNS = ['todo', 'inprogress', 'done'];

function DraggableCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-40' : ''}
    >
      <TaskCard task={task} onClick={() => onOpen(task.id)} />
    </div>
  );
}

function Column({ id, tasks, onOpen, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 transition-colors ${
        isOver ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400' : 'bg-gray-100 dark:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {TASK_STATUS_LABEL[id]} <span className="text-gray-400">({tasks.length})</span>
        </h2>
        <button
          onClick={() => onAdd(id)}
          className="text-gray-400 hover:text-indigo-600"
          title={`Add task to ${TASK_STATUS_LABEL[id]}`}
        >
          +
        </button>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onOpen, onAdd, onMove }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const byStatus = (s) => tasks.filter((t) => t.status === s);
  const activeTask = tasks.find((t) => t.id === activeId);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const target = over.id; // column id
    if (task && COLUMNS.includes(target) && task.status !== target) {
      onMove(task, target);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <Column key={col} id={col} tasks={byStatus(col)} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
