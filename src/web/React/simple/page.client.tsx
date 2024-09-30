'use client'
import { styled } from "styled-components"
import { useState, useRef } from 'react'
import { FontJsonModel } from '../_types/basic'
import { DragAndDropFontJson } from "../_parts/DragAndDropFontJson"
import { Textarea } from "components/shadcn/ui/textarea"
import { ScrollArea } from "components/shadcn/ui/scroll-area"
import { Input } from "components/shadcn/ui/input"

export function SimpleFontRenderer() {

  const [parsedData, setParsedData] = useState<FontJsonModel | null>(null)
  const [inputText, setInputText] = useState<string>('')
  const [fontSize, setFontSize] = useState<number>(24)
  const [matchingTextHeight] = useState<number>(40)
  const letters = parsedData?.letters  || []
  const matchingTextRef = useRef<HTMLDivElement>(null)
  const characterSpacing = parsedData?.characterSpacing || 2

  return (
    <>
      <Container>
        <DragAndDropFontJson setParsedData={setParsedData} />
        <div>
            <label htmlFor="fontSize">Font Size:</label>
            <Input
              id="fontSize"
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={12}
              max={240}
            />
          </div>
        <Textarea
            placeholder="Enter text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 max-w-[768px]"
          />
          <div className="w-full max-w-[768px]">
            <h3 className="text-lg font-semibold mb-2">Matching Text</h3>
            <ScrollArea className={`h-[${matchingTextHeight}px] border rounded p-4`}>
              <div ref={matchingTextRef} className="whitespace-pre-wrap leading-relaxed" style={{ letterSpacing: `${characterSpacing}px`, fontSize: `${fontSize}px` }}>
                {inputText.split('').map((char, index) => {
                  const matchingFont = letters.find(letter => letter.letter === char)
                  if (matchingFont) {
                    return (
                      <img
                        key={index}
                        src={matchingFont.imageBase64}
                        alt={char}
                        className="inline-block align-middle"
                        style={{ height: `${fontSize}px`, width: 'auto', marginRight: `${characterSpacing}px` }}
                      />
                    )
                  }
                  return <span key={index}>{char}</span>
                })}
              </div>
            </ScrollArea>
          </div>

      </Container>
    </>
  )
}

const Container = styled.div`
  color: ${({ theme }) => theme.color.textBase};
  padding: 24px 36px;
  display: grid;
  place-items: center;
  gap: 30px;
`