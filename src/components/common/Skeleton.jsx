export default function Skeleton({ className = '', variant = 'default', width, height }) {
  const variants = {
    default: 'h-4 bg-gray-200 rounded',
    text: 'h-4 bg-gray-200 rounded',
    title: 'h-8 bg-gray-200 rounded',
    circle: 'rounded-full bg-gray-200',
    rectangle: 'bg-gray-200 rounded-lg',
    card: 'h-32 bg-gray-200 rounded-xl',
  }

  const baseClass = variants[variant] || variants.default

  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      className={`animate-pulse ${baseClass} ${className}`}
      style={style}
      aria-hidden="true"
      role="status"
      aria-label="Carregando..."
    />
  )
}
