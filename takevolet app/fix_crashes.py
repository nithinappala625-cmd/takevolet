import os

def fix_files():
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if file.endswith('.dart'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content.replace('=> context.pop(),', '=> context.canPop() ? context.pop() : null,')
                new_content = new_content.replace('=> context.pop()', '=> { if(context.canPop()) context.pop() }')
                new_content = new_content.replace('context.pop();', 'if(context.canPop()) context.pop();')
                
                if 'build_subcategories_screen.dart' in path:
                    new_content = new_content.replace(
                        'child: Image.network(',
                        'child: Image.network(\n                                errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, color: Colors.grey),\n'
                    )
                
                if content != new_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Fixed {path}')

fix_files()
