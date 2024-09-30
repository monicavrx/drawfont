'use client'
import { styled } from "styled-components"
import { useState } from 'react'
import { FontJsonModel } from '../_types/basic'
import { DragAndDropFontJson } from "../_parts/DragAndDropFontJson"
import { Textarea } from "components/shadcn/ui/textarea"
import { Input } from "components/shadcn/ui/input"

export function InputFontRenderer() {

  const [parsedData, setParsedData] = useState<FontJsonModel | null>(null)
  const [inputText, setInputText] = useState<string>('')
  const [fontSize, setFontSize] = useState<number>(24)

  const letters = parsedData?.letters  || []
  return (
    <>
      <Container>
        <DragAndDropFontJson setParsedData={setParsedData} />
        <ResultContainer>
          <TextContainer>
            <InputSection>
              <StyledTextarea
                placeholder="Enter text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
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
            </InputSection>
            <OutputContainer>
              < OutputText style={{ fontSize: `${fontSize}px` }}>
                {inputText.split('').map((char, index) => {
                  const matchingFont = letters.find(font => font.letter === char)
                  if (matchingFont) {
                    return (
                      <FontImage
                        key={index}
                        src={matchingFont.imageBase64}
                        alt={char}
                        style={{ height: `${fontSize}px` }}
                      />
                    )
                  }
                  return <span key={index}>{char}</span>
                })}
              </OutputText >
            </OutputContainer >
          </TextContainer >
        </ResultContainer >
      </Container >
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

const ResultContainer = styled.div`

`

const TextContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(45vw, 1fr) minmax(45vw, 1fr);
  gap: 16px;
  justify-content: center;
  height: 60vh;
`

const InputSection = styled.div`
  
`
const StyledTextarea = styled(Textarea)`
  width: 100%;
  min-height: 500px;s
  &:focus {
    outline: none;
  }
`

const OutputContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.color.borderColor};
  border-radius: 4px;
  padding: 16px;
`

const OutputText = styled.div`
  white-space: pre-wrap;
  line-height: 1.5;
`

const FontImage = styled.img`
  display: inline-block;
  vertical-align: middle;
  width: auto;
`