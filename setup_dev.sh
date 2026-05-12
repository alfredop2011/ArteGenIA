#!/bin/bash
# Ejecuta este script en el terminal de PhpStorm (Alt+F12)
# desde la raíz de tu proyecto ArteGenIA

echo "=== ArteGenIA — Setup rama dev ==="

# 1. Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# 2. Crear rama dev (si ya existe, cambiar a ella)
git checkout -b dev 2>/dev/null || git checkout dev

# 3. Copiar los archivos nuevos/modificados
# (Asumiendo que ya los copiaste manualmente a sus rutas)

# 4. Añadir todo al commit
git add components/editor/EditorWorkspace.tsx
git add hooks/useEditorStorage.ts
git add app/layout.tsx

# 5. Hacer commit
git commit -m "feat: localStorage, fontSize, eliminar/mover capas, fuentes Google

- Guardar diseño como JSON en localStorage por plantilla
- Cargar diseño guardado automáticamente al reabrir el editor
- Control de tamaño de fuente (slider + input numérico, 8-200px)
- Botón eliminar capa seleccionada (también con tecla Delete)
- Botones mover capa adelante/atrás
- Subida de imagen con ajuste automático de tamaño
- Fuentes Google: Bebas Neue, Anton, Montserrat, Playfair Display, Great Vibes, Oswald
- Barra superior con estado de guardado y exportar PNG
- Metadatos y título de la app actualizados"

# 6. Push a origin dev
git push -u origin dev

echo ""
echo "✓ Rama dev actualizada en GitHub"
echo "URL: https://github.com/alfredop2011/ArteGenIA/tree/dev"
