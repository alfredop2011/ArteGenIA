-- Feature: Solicitar foto desde editor (botón toolbar contextual)
--
-- Permite vincular un invite de colaborador a un layer concreto de un
-- proyecto. Cuando el colaborador sube la foto en /upload/[token], el
-- backend detecta estos campos y auto-actualiza el fabric_json del
-- proyecto reemplazando el src del layer indicado.
--
-- Ambos campos son NULLABLE: el flujo clásico de "Invitar colaborador"
-- desde /mis-recursos sigue funcionando sin context.

ALTER TABLE public.collaborator_invites
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.collaborator_invites
  ADD COLUMN IF NOT EXISTS target_layer_id text;

-- Índice ligero para queries de "qué invites tengo pendientes en este proyecto"
CREATE INDEX IF NOT EXISTS idx_invites_project_id
  ON public.collaborator_invites(project_id)
  WHERE project_id IS NOT NULL;

COMMENT ON COLUMN public.collaborator_invites.project_id IS
  'Si el invite se generó desde el editor sobre un proyecto concreto, contiene su id. Permite auto-actualizar el fabric_json al recibir la foto.';
COMMENT ON COLUMN public.collaborator_invites.target_layer_id IS
  'customId del layer dentro del fabric_json donde insertar la foto del colaborador. Solo válido si project_id no es NULL.';
