import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

/**
 * Componente de seleção múltipla com dropdown
 * 
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {Array<string>} props.options - Array de opções disponíveis
 * @param {Array<string>} props.selected - Array de opções selecionadas
 * @param {Function} props.onChange - Callback quando seleção muda
 * @param {string} props.placeholder - Placeholder quando nenhum selecionado
 * @param {React.Component} props.icon - Ícone opcional
 */
export default function MultiSelect({ 
  label, 
  options = [], 
  selected = [], 
  onChange,
  placeholder = 'Selecione...',
  icon: Icon
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }
  
  const clearAll = () => {
    onChange([])
  }
  
  const selectAll = () => {
    onChange([...options])
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {Icon && <Icon size={16} className="text-gray-500 flex-shrink-0" />}
          {selected.length === 0 ? (
            <span className="text-gray-500 truncate">{placeholder}</span>
          ) : selected.length === options.length ? (
            <span className="text-gray-900 truncate">Todos selecionados</span>
          ) : (
            <span className="text-gray-900 truncate">
              {selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}
            </span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Header com ações */}
          {options.length > 0 && (
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Selecionar todos
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                >
                  <X size={12} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          )}
          
          {/* Lista de opções */}
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhuma opção disponível
            </div>
          ) : (
            <div className="py-1">
              {options.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-secondary-50' : ''
                    }`}
                  >
                    <span className={`text-sm text-left ${isSelected ? 'text-secondary-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                    {isSelected && (
                      <Check size={16} className="text-secondary-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Badges dos selecionados */}
      {selected.length > 0 && selected.length < 4 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOption(item)
                }}
                className="hover:text-secondary-900 transition-colors"
                aria-label={`Remover ${item}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
