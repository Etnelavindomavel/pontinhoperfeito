import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit3, Save, RotateCcw, X } from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin'

/**
 * Item individual arrastável
 */
function SortableItem({ id, children, isEditMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-move z-10 bg-secondary-100 p-2 rounded-lg hover:bg-secondary-200 transition-colors"
        >
          <GripVertical size={20} className="text-secondary-600" />
        </div>
      )}
      <div className={isEditMode ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}

/**
 * Container para itens arrastáveis com controles de edição (apenas admins)
 */
export default function SortableContainer({ 
  items, 
  onReorder, 
  onSave, 
  onReset, 
  storageKey, 
  userId, 
  children 
}) {
  const { isAdmin } = useAdmin()
  const [isEditMode, setIsEditMode] = useState(false)
  const [localItems, setLocalItems] = useState(items)
  
  // Sincronizar localItems quando items mudar
  useEffect(() => {
    setLocalItems(items)
  }, [items])
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  const handleSave = () => {
    onReorder(localItems)
    if (onSave) onSave(localItems)
    setIsEditMode(false)
  }
  
  const handleCancel = () => {
    setLocalItems(items)
    setIsEditMode(false)
  }
  
  const handleReset = () => {
    if (confirm('Deseja restaurar a ordem padrão? Esta ação não pode ser desfeita.')) {
      if (onReset) onReset()
      setLocalItems(items)
      setIsEditMode(false)
    }
  }
  
  // Se não for admin, renderiza normalmente sem controles
  if (!isAdmin) {
    return <div className="space-y-6">{items.map(id => <div key={id}>{children(id)}</div>)}</div>
  }
  
  return (
    <div>
      {/* Controles de edição */}
      <div className="flex items-center justify-end space-x-3 mb-6">
        {!isEditMode ? (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors text-sm"
          >
            <Edit3 size={16} />
            <span>Reorganizar Seções</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              <RotateCcw size={16} />
              <span>Resetar</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Save size={16} />
              <span>Salvar</span>
            </button>
          </>
        )}
      </div>
      
      {/* Banner modo edição */}
      {isEditMode && (
        <div className="mb-6 bg-secondary-50 border-2 border-secondary-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <GripVertical className="text-secondary-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-secondary-900 mb-1">
                Modo de Reorganização Ativo
              </h4>
              <p className="text-sm text-secondary-700">
                Use as alças à esquerda para arrastar e reordenar as seções. Salve quando terminar.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Container arrastável */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localItems} strategy={verticalListSortingStrategy}>
          <div className={`space-y-6 ${isEditMode ? 'ml-8' : ''}`}>
            {localItems.map((id) => (
              <SortableItem key={id} id={id} isEditMode={isEditMode}>
                {children(id)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
