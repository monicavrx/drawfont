# drawfont

![image images/drawFontLp.png](images/drawfontLp.png)

Website: https://drawfont.com

Awesome: https://github.com/monicavrx/awesome-drawfont

## Overview

DrawFont is an open-source software (OSS) project that allows handwritten fonts to be loaded and used in various projects.
As long as you have a DrawFont file in JSON format, you can load and use that font anywhere.

While the number of compatible software is currently limited, we plan to expand the range of supported applications in the future.

## LICENSE

Draw Font Open Source License
- The copyright of each individual's font belongs to the creator and can be freely sold.
- This license only restricts starting identical SaaS projects.

## JSON Schema (zod)

```
export const letterJsonSchema = z.object({
    letter: z.string(),
    imageBase64: z.string()
})
export type LetterJsonModel = z.infer<typeof letterJsonSchema>

export const FontVersionSchema = z.enum(['v0.0.9', 'v1.0.0', 'v1.0.1'])
export type FontVersion = z.infer<typeof FontVersionSchema>

export const fontJsonSchema = z.object({
    uid: z.string().min(12),
    userUid: z.string().min(3),
    name: z.string().min(1).max(64),
    licenseUrl: z.string().url().optional(),
    version: FontVersionSchema,
    characterSpacing: z.number(),
    letters: z.array(letterJsonSchema),
    createdAt: z.string().datetime(),
})
export type FontJsonModel = z.infer<typeof fontJsonSchema>
```

## Currently Compatible Software

- Unity Editor
- Blender
- Web (React)

## Coming Soon

- Canva
- Unreal Engine
- Godot
- After Effects
- Photoshop
- Illustrator
- 3ds Max
- Cinema 4D
- Houdini
- Substance Painter
- ZBrush
- etc...


## Roadmap

- [ ] Support story progression dialogs
- [ ] Add particle effects using ancient-style characters
- [ ] Add various types of Playgrounds
- [ ] Publish a dedicated npm package for usage
- [ ] etc...


## Contributing

We welcome contributions to the project! If you have any ideas or suggestions, please feel free to open an issue or submit a pull request.

commit to this project or 

link to awesome-drawfont

Awesome: https://github.com/monicavrx/awesome-drawfont


## Demo

### Web Drawing
![image images/demoDrawing.gif](images/demoDrawing.gif)

### Web Writing
![image images/demoWriting.gif](images/demoWriting.gif)

### Unity
![image images/demoUnity.gif](images/demoUnity.gif)

### Blender
![image images/demoBlender.gif](images/demoBlender.gif)

