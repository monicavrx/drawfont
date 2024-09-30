import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUploadCloud } from 'react-icons/fi'
import { fontJsonSchema, FontJsonModel } from '../_types/basic'
import { styled } from 'styled-components'

type Props = {
    setParsedData: (data: FontJsonModel) => void
}

export function DragAndDropFontJson({ setParsedData }: Props) {
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        const reader = new FileReader()
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                const result = event.target?.result
                if (typeof result === 'string') {
                    const json = JSON.parse(result)
                    const validatedData = fontJsonSchema.parse(json)
                    setParsedData(validatedData)
                    setError(null)
                }
            } catch (err) {
                setError('Invalid JSON or schema mismatch')
            }
        }
        reader.readAsText(file)
    }, [setParsedData])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <>
            <DropZone {...getRootProps()} isDragActive={isDragActive}>
                <input {...getInputProps()} />
                <DropzoneContent>
                    <FiUploadCloud size={48} />
                    {isDragActive ? (
                        <DropText>Release to drop the JSON file here</DropText>
                    ) : (
                        <DropText>Drag and drop a JSON file here, or click to select</DropText>
                    )}
                </DropzoneContent>
            </DropZone>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </>
    )
}

const DropZone = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${({ theme, isDragActive }) => isDragActive ? theme.color.primary : theme.color.textBase};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${({ theme, isDragActive }) => isDragActive ? theme.color.borderGray : 'transparent'};

  &:hover {
    border-color: ${({ theme }) => theme.color.primary};
    background-color: ${({ theme }) => theme.color.borderColor};
  }
`

const DropzoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

const DropText = styled.p`
  font-size: 18px;
  font-weight: 500;
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.color.danger};
  font-weight: 500;
`