import { useState } from 'react'
import { HiCloudArrowUp, HiXMark, HiPhoto } from 'react-icons/hi2'

export default function FileUpload({ 
  label, 
  name,
  onChange,
  accept = 'image/*',
  required = false,
  error,
  hint,
  preview = true
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result)
        }
        reader.readAsDataURL(file)
      }
      
      if (onChange) {
        onChange(e)
      }
    }
  }

  const clearFile = () => {
    setPreviewUrl(null)
    setFileName('')
    const input = document.getElementById(name)
    if (input) input.value = ''
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="space-y-3">
        {/* Upload Area */}
        <label 
          htmlFor={name}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            error
              ? 'border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600'
          } bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <HiCloudArrowUp className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {accept === 'image/*' ? 'PNG, JPG or JPEG (MAX. 5MB)' : 'Supported file types'}
            </p>
          </div>
          <input 
            id={name}
            name={name}
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={handleFileChange}
            required={required}
          />
        </label>

        {/* Preview */}
        {previewUrl && (
          <div className="relative">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {fileName && !previewUrl && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <HiPhoto className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {fileName}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
}