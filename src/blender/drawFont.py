bl_info = {
    "name": "Draw Font Importer",
    "author": "monicavrx",
    "version": (1, 0),
    "blender": (4, 2, 0),
    "location": "Operator Search",
    "description": "Imports custom font from JSON and creates 3D text",
    "warning": "",
    "wiki_url": "https://github.com/monicavrx/drawfont",
    "category": "Object",
}

import os
import json
import base64
import bpy
import random
from bpy.props import StringProperty, FloatProperty, EnumProperty
from bpy.types import Operator

class OT_DrawFont(Operator):
    bl_idname = "object.draw_font"
    bl_label = "DrawFont"
    bl_description = "Import custom font from JSON and create 3D text"
    bl_options = {'REGISTER', 'UNDO'}

    downloadFolderPath = os.path.expanduser("~") + "/Downloads/"

    json_file_path: StringProperty(
        name="JSON File Path",
        description="Path to the JSON file",
        default=downloadFolderPath,
        subtype='FILE_PATH',
    )

    input_string: StringProperty(
        name="Input String",
        description="String to display",
        default="hello",
    )

    spacing: FloatProperty(
        name="Spacing",
        description="Spacing between characters",
        default=0.0,
        min=0.0,
    )

    output_dir: StringProperty(
        name="Output Directory",
        description="Directory to save images",
        default=downloadFolderPath,
        subtype='DIR_PATH',
    )

    draw_mode: EnumProperty(
        name="Draw Mode",
        description="Choose the draw mode for the text",
        items=[
            ('RANDOM', "Random Color", "Apply random colors to text"),
            ('BLACK', "Black Color", "Apply black color to text"),
            ('WHITE', "White Color", "Apply white color to text"),
        ],
        default='BLACK',
    )

    def execute(self, context):
        json_file_path = self.json_file_path
        input_string = self.input_string
        spacing = self.spacing
        output_dir = self.output_dir
        draw_mode = self.draw_mode

        # === Script start ===

        # Convert JSON file path to absolute path
        json_file_path = os.path.abspath(bpy.path.abspath(json_file_path))

        if not os.path.exists(json_file_path):
            self.report({'ERROR'}, f"The specified JSON file does not exist: {json_file_path}")
            return {'CANCELLED'}

        # Set the directory to save images
        if output_dir:
            output_dir = os.path.abspath(bpy.path.abspath(output_dir))
            if not os.path.exists(output_dir):
                self.report({'ERROR'}, f"The specified output directory does not exist: {output_dir}")
                return {'CANCELLED'}
        else:
            output_dir = os.path.expanduser("~")  # User's home directory

        save_images = True  # True if saving images

        # Function to complete padding
        def fix_base64_padding(s):
            return s + '=' * (-len(s) % 4)

        # Function to validate JSON data
        def validate_json(data):
            required_fields = ['uid', 'letters']
            for field in required_fields:
                if field not in data:
                    self.report({'ERROR'}, f"The JSON data is missing the '{field}' field.")
                    raise ValueError(f"The JSON data is missing the '{field}' field.")

            if not isinstance(data['letters'], list) or not data['letters']:
                self.report({'ERROR'}, "The 'letters' field in the JSON data is empty or not a list.")
                raise ValueError("The 'letters' field in the JSON data is empty or not a list.")

            for index, item in enumerate(data['letters']):
                if not isinstance(item, dict):
                    self.report({'ERROR'}, f"Item {index} in 'letters' is not a dictionary.")
                    raise ValueError(f"Item {index} in 'letters' is not a dictionary.")
                if 'letter' not in item or 'imageBase64' not in item:
                    self.report({'ERROR'}, f"Item {index} in 'letters' is missing the 'letter' or 'imageBase64' field.")
                    raise ValueError(f"Item {index} in 'letters' is missing the 'letter' or 'imageBase64' field.")
                if not item['letter']:
                    self.report({'ERROR'}, f"The 'letter' field in item {index} of 'letters' is empty.")
                    raise ValueError(f"The 'letter' field in item {index} of 'letters' is empty.")
                if not item['imageBase64']:
                    self.report({'ERROR'}, f"The 'imageBase64' field in item {index} of 'letters' is empty.")
                    raise ValueError(f"The 'imageBase64' field in item {index} of 'letters' is empty.")

        # Load JSON data
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            self.report({'ERROR'}, f"Failed to load JSON file: {json_file_path}\nError: {e}")
            return {'CANCELLED'}

        # Validate JSON data
        try:
            validate_json(data)
        except ValueError as e:
            self.report({'ERROR'}, f"{e}")
            return {'CANCELLED'}

        uid = data['uid']

        # Map characters to corresponding image data
        letter_images = {}
        for item in data['letters']:
            letter = item['letter']
            image_base64 = item['imageBase64']
            letter_images[letter] = image_base64

        # Create material cache
        material_cache = {}

        # Initialize the starting position
        x_position = 0

        for letter in input_string:
            if letter not in letter_images:
                self.report({'WARNING'}, f"Character '{letter}' not found in JSON data.")
                continue

            # Get Base64 data
            image_base64 = letter_images[letter]
            if not image_base64:
                self.report({'WARNING'}, f"The 'imageBase64' data for character '{letter}' is empty.")
                continue

            # Remove Data URI scheme
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',', 1)[1]

            # Remove unnecessary spaces and line breaks
            image_base64 = image_base64.replace('\n', '').replace('\r', '').replace(' ', '')

            # Complete padding
            image_base64_padded = fix_base64_padding(image_base64)

            # Base64 decode
            try:
                image_data = base64.b64decode(image_base64_padded)
            except base64.binascii.Error as e:
                self.report({'ERROR'}, f"Failed to decode image data for character '{letter}' (Base64 error): {e}")
                continue
            except Exception as e:
                self.report({'ERROR'}, f"An unexpected error occurred while decoding image data for character '{letter}': {e}")
                continue

            # Set image file path
            image_name = f"{uid}_{letter}"
            image_file_path = os.path.join(output_dir, f"{image_name}.png")

            # Save image
            try:
                with open(image_file_path, 'wb') as img_file:
                    img_file.write(image_data)
            except Exception as e:
                self.report({'ERROR'}, f"Failed to save image file: {image_file_path}\nError: {e}")
                continue

            # Load image into Blender
            if os.path.exists(image_file_path):
                try:
                    image = bpy.data.images.load(image_file_path)
                except Exception as e:
                    self.report({'ERROR'}, f"Failed to load image '{image_name}': {e}")
                    continue
            else:
                self.report({'ERROR'}, f"Image file '{image_file_path}' does not exist.")
                continue

            # Delete image if flag is False
            if not save_images:
                try:
                    os.remove(image_file_path)
                except Exception as e:
                    self.report({'WARNING'}, f"Failed to delete image file '{image_file_path}': {e}")

            # Get image size
            image_width = image.size[0]
            image_height = image.size[1]

            # Set default value if image width or height is zero
            if image_width == 0 or image_height == 0:
                self.report({'WARNING'}, f"Invalid image size for character '{letter}'. Using default size.")
                image_width = 500
                image_height = 500

            # Set material name
            material_name = f"drawfont-{uid}-{letter}"

            # Get material from cache or create new material
            if material_name in material_cache:
                material = material_cache[material_name]
            else:
                material = bpy.data.materials.new(name=material_name)
                material.use_nodes = True

                # Clear nodes
                nodes = material.node_tree.nodes
                nodes.clear()

                # Reconstruct nodes
                tex_image_node = nodes.new(type='ShaderNodeTexImage')
                tex_image_node.location = (-300, 300)
                tex_image_node.image = image

                bsdf_node = nodes.new(type='ShaderNodeBsdfPrincipled')
                bsdf_node.location = (0, 300)

                output_node = nodes.new(type='ShaderNodeOutputMaterial')
                output_node.location = (300, 300)

                color_ramp_node = nodes.new(type='ShaderNodeValToRGB')
                color_ramp_node.location = (-300, 0)

                # Set Emission Strength to 1
                bsdf_node.inputs['Emission Strength'].default_value = 1.0

                if draw_mode == 'RANDOM':
                    # Set Color Ramp color randomly
                    random_color = (random.random(), random.random(), random.random())
                    color_ramp_node.color_ramp.elements[0].color = random_color + (1,) # Character color
                    color_ramp_node.color_ramp.elements[1].color = (0, 0, 0, 0)  # Background color
                elif draw_mode == 'WHITE':
                    color_ramp_node.color_ramp.elements[0].color = (1, 1, 1, 1)  # Character color
                    color_ramp_node.color_ramp.elements[1].color = (0, 0, 0, 0)  # Background color
                elif draw_mode == 'BLACK':
                    color_ramp_node.color_ramp.elements[0].color = (0, 0, 0, 1)  # Character color
                    color_ramp_node.color_ramp.elements[1].color = (1, 1, 1, 0)  # Background color

                # Connect nodes
                links = material.node_tree.links
                links.new(tex_image_node.outputs['Color'], color_ramp_node.inputs['Fac'])
                links.new(color_ramp_node.outputs['Color'], bsdf_node.inputs['Base Color'])
                links.new(color_ramp_node.outputs['Color'], bsdf_node.inputs['Emission Color'])
                links.new(color_ramp_node.outputs['Alpha'], bsdf_node.inputs['Alpha'])
                links.new(bsdf_node.outputs['BSDF'], output_node.inputs['Surface'])

                # Change material settings to enable transparency
                material.blend_method = 'BLEND'
                material.shadow_method = 'HASHED'

                # Save material to cache
                material_cache[material_name] = material

            # Add plane mesh
            bpy.ops.mesh.primitive_plane_add(size=1, location=(x_position, 0, 0))
            plane = bpy.context.active_object
            plane.name = f"{letter}_plane"

            # Check UV map
            if not plane.data.uv_layers:
                plane.data.uv_layers.new(name='UVMap')

            # Assign material to plane
            if plane.data.materials:
                plane.data.materials[0] = material
            else:
                plane.data.materials.append(material)

            # Scale plane according to image aspect ratio
            aspect_ratio = image_width / image_height if image_height != 0 else 1
            plane.scale[0] *= aspect_ratio

            # Calculate the position of the next character
            plane_width = aspect_ratio
            x_position += plane_width / 2 + spacing
            plane.location.x = x_position
            x_position += plane_width / 2

        self.report({'INFO'}, "Script execution completed.")
        return {'FINISHED'}

    def invoke(self, context, event):
        wm = context.window_manager
        return wm.invoke_props_dialog(self)

def menu_func(self, context):
    self.layout.operator(OT_DrawFont.bl_idname, text="DrawFont")

def register():
    bpy.utils.register_class(OT_DrawFont)
    bpy.types.TOPBAR_MT_file_import.append(menu_func)

def unregister():
    bpy.utils.unregister_class(OT_DrawFont)
    bpy.types.TOPBAR_MT_file_import.remove(menu_func)

if __name__ == "__main__":
    register()
