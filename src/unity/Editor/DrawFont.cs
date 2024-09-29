using UnityEngine;
using UnityEditor;
using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine.UI;

public class DrawFontsWindow : EditorWindow
{
    private string jsonFilePath = "";
    private string inputString = "hello";
    private float spacing = 0.1f;
    private FontData fontData;
    private Dictionary<string, Sprite> letterSprites = new Dictionary<string, Sprite>();
    private GameObject canvasObject;
    private RectTransform contentParent;

    private Vector2 scrollPosition;
    private string newInputString = "";
    private float newSpacing = 0.1f;

    [MenuItem("DrawFont/RenderFonts")]
    public static void ShowWindow()
    {
        GetWindow<DrawFontsWindow>("DrawFont");
    }

    private void OnGUI()
    {
        GUILayout.Label("DrawFonts Settings", EditorStyles.boldLabel);

        scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);

        jsonFilePath = EditorGUILayout.TextField("JSON File Path", jsonFilePath);
        if (GUILayout.Button("Browse JSON File"))
        {
            jsonFilePath = EditorUtility.OpenFilePanel("Select JSON File", "", "json");
        }

        GUILayout.Space(10);
        GUILayout.Label("Input Form", EditorStyles.boldLabel);

        newInputString = EditorGUILayout.TextField("New Input String", newInputString);
        newSpacing = EditorGUILayout.FloatField("New Spacing", newSpacing);

        if (GUILayout.Button("Update Settings"))
        {
            inputString = newInputString;
            spacing = newSpacing;
            GUI.FocusControl(null);
        }

        GUILayout.Space(10);
        GUILayout.Label("Current Settings", EditorStyles.boldLabel);
        EditorGUILayout.LabelField("Current Input String", inputString);
        EditorGUILayout.LabelField("Current Spacing", spacing.ToString());

        EditorGUILayout.EndScrollView();

        GUILayout.Space(10);
        if (GUILayout.Button("Render Letters"))
        {
            RenderLetters();
        }
    }

    private void RenderLetters()
    {
        if (string.IsNullOrEmpty(jsonFilePath) || !File.Exists(jsonFilePath))
        {
            EditorUtility.DisplayDialog("Error", "Invalid JSON file path", "OK");
            return;
        }

        string jsonContent = File.ReadAllText(jsonFilePath);
        //JsonConvert is removed.  A custom JSON parser will need to be implemented here.  This is beyond the scope of this prompt.
        //fontData = JsonConvert.DeserializeObject<FontData>(jsonContent);

        // Placeholder for JSON deserialization - replace with your custom implementation
        try{
            fontData = JsonUtility.FromJson<FontData>(jsonContent);
        } catch (Exception e){
            EditorUtility.DisplayDialog("Error", $"Failed to parse JSON: {e.Message}", "OK");
            return;
        }


        if (fontData == null || fontData.letters == null || fontData.letters.Count == 0)
        {
            EditorUtility.DisplayDialog("Error", "Invalid JSON data", "OK");
            return;
        }

        CreateLetterSprites();
        CreateCanvas();
        CreateLetters();
    }

    private void CreateLetterSprites()
    {
        letterSprites.Clear();
        foreach (var letter in fontData.letters)
        {
            Sprite sprite = CreateSpriteFromBase64(letter.imageBase64);
            if (sprite != null)
            {
                letterSprites[letter.letter] = sprite;
            }
        }
    }

    private Sprite CreateSpriteFromBase64(string base64)
    {
        try
        {
            base64 = base64.Trim();
            if (base64.StartsWith("data:image/png;base64,"))
            {
                base64 = base64.Substring("data:image/png;base64,".Length);
            }

            byte[] imageData = Convert.FromBase64String(base64);
            Texture2D texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            if (texture.LoadImage(imageData))
            {
                // Process pixels to set white background to transparent
                Color[] pixels = texture.GetPixels();
                for (int i = 0; i < pixels.Length; i++)
                {
                    // Check if the pixel is white (you might need to adjust the threshold)
                    if (pixels[i].r > 0.95f && pixels[i].g > 0.95f && pixels[i].b > 0.95f)
                    {
                        pixels[i].a = 0f; // Set alpha to 0 to make it transparent
                    }
                }
                texture.SetPixels(pixels);
                texture.Apply();

                Sprite sprite = Sprite.Create(
                    texture,
                    new Rect(0, 0, texture.width, texture.height),
                    new Vector2(0.5f, 0.5f),
                    100f,
                    0,
                    SpriteMeshType.FullRect
                );
                return sprite;
            }
            else
            {
                Debug.LogError("Failed to load image from Base64 data");
                return null;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error creating sprite from Base64: {e.Message}");
            return null;
        }
    }


    private void CreateCanvas()
    {
        if (canvasObject != null)
        {
            DestroyImmediate(canvasObject);
        }

        canvasObject = new GameObject("LetterCanvas");
        Canvas canvas = canvasObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        CanvasScaler scaler = canvasObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);
        canvasObject.AddComponent<GraphicRaycaster>();

        contentParent = new GameObject("Content").AddComponent<RectTransform>();
        contentParent.SetParent(canvasObject.transform, false);
        contentParent.anchorMin = new Vector2(0, 0.5f);
        contentParent.anchorMax = new Vector2(1, 0.5f);
        contentParent.anchoredPosition = Vector2.zero;
        contentParent.sizeDelta = new Vector2(0, 100);  // Adjust height as needed
    }

    private void CreateLetters()
    {
        float xPosition = 0;
        float maxHeight = 0;

        foreach (Transform child in contentParent)
        {
            DestroyImmediate(child.gameObject);
        }

        foreach (char c in inputString)
        {
            string letterKey = c.ToString();
            if (!letterSprites.ContainsKey(letterKey)) continue;

            Sprite letterSprite = letterSprites[letterKey];

            GameObject letterObject = new GameObject($"Letter_{c}");
            letterObject.transform.SetParent(contentParent, false);

            Image letterImage = letterObject.AddComponent<Image>();
            letterImage.sprite = letterSprite;
            letterImage.preserveAspect = true;

            // Ensure the image uses the sprite's alpha
            letterImage.type = Image.Type.Simple;
            letterImage.color = Color.white;

            RectTransform rectTransform = letterImage.rectTransform;
            rectTransform.anchorMin = new Vector2(0, 0.5f);
            rectTransform.anchorMax = new Vector2(0, 0.5f);

            // Set size based on the sprite's size
            float spriteHeight = 100f;  // Desired height of each letter
            float spriteWidth = (letterSprite.rect.width / letterSprite.rect.height) * spriteHeight;
            rectTransform.sizeDelta = new Vector2(spriteWidth, spriteHeight);

            // Position the letter
            rectTransform.anchoredPosition = new Vector2(xPosition + (spriteWidth / 2), 0);

            xPosition += spriteWidth + spacing;
            maxHeight = Mathf.Max(maxHeight, spriteHeight);
        }

        // Adjust content parent size
        contentParent.sizeDelta = new Vector2(xPosition, maxHeight);
    }
}

[Serializable]
public class FontData
{
    public string uid;
    public string version;
    public string userUid;
    public string name;
    public List<LetterInfo> letters;
}

[Serializable]
public class LetterInfo
{
    public string letter;
    public string imageBase64;
}