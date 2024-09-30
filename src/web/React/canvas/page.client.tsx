'use client'
import { styled } from "styled-components"
import { useState, useRef, useEffect } from 'react'
import { FontJsonModel } from '../_types/basic'
import { DragAndDropFontJson } from "../_parts/DragAndDropFontJson"
import { Textarea } from "components/shadcn/ui/textarea"
import { Button } from "components/shadcn/ui/button"
import { Input } from "components/shadcn/ui/input"
import { Checkbox } from "components/shadcn/ui/checkbox"
import { saveAs } from 'file-saver'

export function BigFontRenderer() {

  const [parsedData, setParsedData] = useState<FontJsonModel | null>(null)
  const [inputText, setInputText] = useState<string>('')
  const [letterSize, setLetterSize] = useState<number>(48)
  const [transparentBackground, setTransparentBackground] = useState<boolean>(true)
  const [backgroundColor, setBackgroundColor] = useState<string>('#fefefe')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(600)
  const [canvasHeight, setCanvasHeight] = useState(400)

  const letters = parsedData?.letters || []

  useEffect(() => {
    drawTextOnCanvas()
  }, [inputText, letters, letterSize, transparentBackground, backgroundColor, canvasWidth, canvasHeight])

  const drawTextOnCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Increase canvas size for better resolution
    const scale = 2
    canvas.width = canvasWidth * scale
    canvas.height = canvasHeight * scale
    ctx.scale(scale, scale)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!transparentBackground) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    let x = 10
    let y = letterSize + 10
    const positions: { char: string, x: number, y: number }[] = []

    inputText.split('').forEach((char) => {
      if (char === '\n') {
        x = 10; // 行の先頭に戻す
        y += letterSize + 10; // 次の行に移動
      } else {
        const matchingFont = letters.find(font => font.letter === char);
        if (matchingFont) {
          positions.push({ char, x, y })
          x += letterSize + 5;
          if (x > canvasWidth - letterSize) {
            x = 10;
            y += letterSize + 10;
          }
        } else {
          ctx.font = `${letterSize}px Arial`;
          const charWidth = ctx.measureText(char).width
          positions.push({ char, x, y })
          x += charWidth + 5;
          if (x > canvasWidth - letterSize) {
            x = 10;
            y += letterSize + 10;
          }
        }
      }
    });

    positions.forEach(({ char, x, y }) => {
      const matchingFont = letters.find(font => font.letter === char);
      if (matchingFont) {
        const img = new Image();
        img.src = matchingFont.imageBase64;
        img.onload = () => {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y - letterSize, letterSize, letterSize);
        };
      } else {
        ctx.font = `${letterSize}px Arial`;
        ctx.fillStyle = 'black';
        // ctx.textRendering = 'optimizeLegibility';
        ctx.fillText(char, x, y);
      }
    })
  }

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, 'output.png')
      }
    }, 'image/png', 1) // Use maximum quality for PNG export
  }

  const handleResize = (event: any, { element, size, handle }: any) => {
    setCanvasWidth(size.width)
    setCanvasHeight(size.height)
  }

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
              <SizeControl>
                <label htmlFor="letterSize">Letter Size:</label>
                <Input
                  id="letterSize"
                  type="number"
                  value={letterSize}
                  onChange={(e) => setLetterSize(Number(e.target.value))}
                  min={12}
                  max={120}
                />
              </SizeControl>
              <BackgroundControl>
                <Checkbox
                  id="transparentBackground"
                  checked={transparentBackground}
                  onCheckedChange={(checked) => setTransparentBackground(checked as boolean)}
                />
                <label htmlFor="transparentBackground">Transparent Background</label>
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  disabled={transparentBackground}
                />
              </BackgroundControl>
              <CanvasSizeControl>
                <label htmlFor="canvasWidth">Canvas Width:</label>
                <Input
                  id="canvasWidth"
                  type="number"
                  min={200}
                  max={1200}
                  step={10}
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(Number(e.target.value))}
                />
              </CanvasSizeControl>
              <CanvasSizeControl>
                <label htmlFor="canvasHeight">Canvas Height:</label>
                <Input
                  id="canvasHeight"
                  type="number"
                  min={100}
                  max={800}
                  step={10}
                  value={canvasHeight}
                  onChange={(e) => setCanvasHeight(Number(e.target.value))}
                />
              </CanvasSizeControl>
            </InputSection>
            <OutputSection>
              {/* <Resizable width={canvasWidth} height={canvasHeight} onResize={handleResize}> */}
                <Canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
              {/* </Resizable> */}
              <ExportButton onClick={handleExport}>Export as PNG</ExportButton>
            </OutputSection>
          </TextContainer>
        </ResultContainer>
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

const ResultContainer = styled.div`
  width: 100%;
`

const TextContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(45vw, 1fr) minmax(45vw, 1fr);
  gap: 16px;
  justify-content: center;
  height: 60vh;
`

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const StyledTextarea = styled(Textarea)`
  width: 100%;
  height: 200px;
  &:focus {
    outline: none;
  }
`

const SizeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const BackgroundControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const CanvasSizeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const OutputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Canvas = styled.canvas`
  border: 1px solid ${({ theme }) => theme.color.borderColor};
  border-radius: 4px;
  width: 100%;
  height: 100%;
`

const ExportButton = styled(Button)`
  align-self: flex-end;
`