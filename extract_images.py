import fitz
import io
from PIL import Image
import os

pdf_path = r"C:\Users\oulay\.gemini\antigravity\brain\2ca0b44a-e198-467a-9f17-19809ac93092\.user_uploaded\media_1789467196668.pdf"
output_dir = r"C:\Users\oulay\beton-industrie\public\images\produits"

os.makedirs(output_dir, exist_ok=True)

pdf_file = fitz.open(pdf_path)

image_index = 0
for page_index in range(len(pdf_file)):
    page = pdf_file[page_index]
    image_list = page.get_images(full=True)
    
    if image_list:
        print(f"[+] Found {len(image_list)} images on page {page_index}")
    else:
        print(f"[!] No images found on page {page_index}")
        
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = pdf_file.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Load with PIL to check size and save
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Filter out very small images (like logos or icons)
            if image.width < 100 or image.height < 100:
                continue
            
            # Filter out the header image (which is probably the big CHEICKNA logo on every page)
            # We want the product images
            
            image_path = os.path.join(output_dir, f"page_{page_index}_img_{img_index}.{image_ext}")
            image.save(image_path)
            print(f"Saved {image_path} ({image.width}x{image.height})")
            image_index += 1
        except Exception as e:
            print(f"Error saving image: {e}")

print(f"Total extracted: {image_index} images")
