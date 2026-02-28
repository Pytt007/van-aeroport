import json
import os

input_path = r'C:\Users\silve\.gemini\antigravity\brain\31862924-f9d1-443f-a632-f261edaa6dc0\.system_generated\steps\104\output.txt'
output_path = r'd:\Application\vanaeroport-master\vanaeroport-master\src\integrations\supabase\types.ts'

with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(data['types'])
